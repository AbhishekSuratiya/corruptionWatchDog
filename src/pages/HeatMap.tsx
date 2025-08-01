import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Map, TrendingUp, AlertTriangle, BarChart3, MapPin, Layers, Zap } from 'lucide-react';
import { RegionStats } from '../types';
import { SEVERITY_COLORS, CORRUPTION_CATEGORIES } from '../lib/constants';
import { DatabaseService } from '../lib/database';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import FloatingCard from '../components/UI/FloatingCard';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// India-specific map styles
const INDIA_MAP_STYLES = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  dark: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
  modern: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};

export default function HeatMap() {
  const [regionData, setRegionData] = useState<RegionStats[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [mapStyle, setMapStyle] = useState<keyof typeof INDIA_MAP_STYLES>('modern');

  useEffect(() => {
    fetchHeatMapData();
  }, []);

  const fetchHeatMapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch real data from database
      const { regionData: dbRegionData, categoryData: dbCategoryData, error: dbError } = await DatabaseService.getHeatMapData();
      
      if (dbError) {
        throw new Error(dbError.message || 'Failed to fetch heat map data');
      }

      // Transform database data to match component interface
      const transformedRegionData: RegionStats[] = dbRegionData.map(item => ({
        region: item.region,
        count: item.count,
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        severity: item.severity
      }));

      // If no real data exists, show a message but don't use mock data
      if (transformedRegionData.length === 0) {
        console.log('No corruption reports found in database yet');
      }

      setRegionData(transformedRegionData);
      setCategoryData(dbCategoryData);

    } catch (err) {
      console.error('Error fetching heat map data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load heat map data');
      setRegionData([]);
      setCategoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMarkerSize = (count: number) => {
    if (count >= 40) return 30;
    if (count >= 30) return 25;
    if (count >= 20) return 20;
    if (count >= 10) return 15;
    return 12;
  };

  const getMarkerColor = (severity: string) => {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS];
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const onBarEnter = (_: any, index: number) => {
    setHoveredBar(index);
  };

  const onBarLeave = () => {
    setHoveredBar(null);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Reports: <span className="font-medium text-red-600">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium text-blue-600">{((data.value / categoryData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Reports: <span className="font-medium text-red-600">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Severity: <span className="font-medium text-orange-600 capitalize">{data.payload.severity}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom Bar Shape with Gradient
  const CustomBar = (props: any) => {
    const { fill, ...rest } = props;
    const gradientId = `gradient-${rest.index}`;
    const isHovered = hoveredBar === rest.index;
    
    return (
      <g>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity={1} />
            <stop offset="100%" stopColor={fill} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <rect
          {...rest}
          fill={`url(#${gradientId})`}
          rx={6}
          ry={6}
          style={{
            filter: isHovered ? 'brightness(1.1) drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'none',
            transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
            transformOrigin: 'bottom',
            transition: 'all 0.3s ease'
          }}
        />
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Static Content */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl">
                <Map className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            India Corruption 
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"> Heat Map</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Real-time visualization of corruption density across Indian states and cities. 
            Data sourced directly from our corruption reports database.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <FloatingCard className="mb-8 bg-red-50 border-2 border-red-200">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                  <p className="text-red-700">{error}</p>
                  <button 
                    onClick={fetchHeatMapData}
                    className="mt-2 text-red-600 hover:text-red-800 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </FloatingCard>
        )}

        {/* Stats Overview - Data Driven */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                <SkeletonLoader className="w-16 h-8 mx-auto mb-2" />
                <SkeletonLoader className="w-20 h-4 mx-auto" />
              </div>
            ))
          ) : (
            <>
              <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300" delay={0}>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {regionData.reduce((sum, region) => sum + region.count, 0)}
                </div>
                <div className="text-gray-600 font-medium">Total Reports</div>
              </FloatingCard>
              <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300" delay={100}>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {regionData.length}
                </div>
                <div className="text-gray-600 font-medium">Active Cities</div>
              </FloatingCard>
              <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300" delay={200}>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {regionData.filter(r => r.severity === 'critical' || r.severity === 'high').length}
                </div>
                <div className="text-gray-600 font-medium">High-Risk Areas</div>
              </FloatingCard>
              <FloatingCard className="p-6 text-center group hover:scale-105 transition-transform duration-300" delay={300}>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {regionData.length > 0 ? Math.round((regionData.reduce((sum, region) => sum + region.count, 0) / regionData.length) * 100) / 100 : 0}
                </div>
                <div className="text-gray-600 font-medium">Avg per City</div>
              </FloatingCard>
            </>
          )}
        </div>

        {/* Map and Charts Grid - Data Driven */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Modern Interactive India Map */}
          <div className="lg:col-span-2">
            <FloatingCard className="overflow-hidden" delay={400}>
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Map className="h-6 w-6 mr-2 text-blue-600" />
                    India Corruption Density Map
                  </h2>
                  
                  {/* Map Style Selector */}
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-gray-500" />
                    <select
                      value={mapStyle}
                      onChange={(e) => setMapStyle(e.target.value as keyof typeof INDIA_MAP_STYLES)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="modern">Modern</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="terrain">Terrain</option>
                      <option value="satellite">Satellite</option>
                    </select>
                  </div>
                </div>
                
                {/* India Map Info */}
                <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real database data</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Live updates</span>
                  </div>
                </div>
              </div>
              
              <div className="h-96 relative">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading real data from database...</p>
                    </div>
                  </div>
                ) : regionData.length === 0 ? (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-8">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
                      <p className="text-gray-500 mb-4">No corruption reports have been submitted yet.</p>
                      <p className="text-sm text-gray-400">Submit your first report to see data on the map!</p>
                    </div>
                  </div>
                ) : (
                  <MapContainer
                    center={[20.5937, 78.9629]} // Center of India
                    zoom={5}
                    minZoom={4}
                    maxZoom={12}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-b-xl"
                  >
                    <TileLayer
                      url={INDIA_MAP_STYLES[mapStyle]}
                      attribution={
                        mapStyle === 'satellite' 
                          ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                          : mapStyle === 'terrain'
                          ? '&copy; OpenTopoMap (CC-BY-SA)'
                          : '&copy; CartoDB &copy; OpenStreetMap contributors'
                      }
                    />
                    {regionData.filter(region => region.latitude && region.longitude).map((region) => (
                      <CircleMarker
                        key={region.region}
                        center={[region.latitude, region.longitude]}
                        radius={getMarkerSize(region.count)}
                        fillColor={getMarkerColor(region.severity)}
                        color="#fff"
                        weight={3}
                        opacity={1}
                        fillOpacity={0.8}
                        eventHandlers={{
                          click: () => setSelectedRegion(region.region),
                          mouseover: (e) => {
                            e.target.setStyle({
                              weight: 4,
                              fillOpacity: 1,
                              radius: getMarkerSize(region.count) + 3
                            });
                          },
                          mouseout: (e) => {
                            e.target.setStyle({
                              weight: 3,
                              fillOpacity: 0.8,
                              radius: getMarkerSize(region.count)
                            });
                          }
                        }}
                      >
                        <Popup className="custom-popup">
                          <div className="text-center p-2">
                            <h3 className="font-bold text-lg text-gray-900">{region.region}</h3>
                            <p className="text-gray-600 mb-2">{region.count} corruption reports</p>
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                              style={{ backgroundColor: getMarkerColor(region.severity) }}
                            >
                              {region.severity.toUpperCase()} RISK
                            </span>
                            <div className="mt-2 text-xs text-gray-500">
                              Real data from database
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                )}
              </div>
              
              {/* Enhanced Legend */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Risk Severity Levels</h4>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
                        <div key={severity} className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-sm text-gray-600 capitalize font-medium">{severity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Circle size indicates</div>
                    <div className="text-sm font-medium text-gray-700">Report frequency</div>
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>

          {/* Charts - Data Driven */}
          <div className="space-y-8">
            {/* Modern Regional Chart */}
            <FloatingCard className="p-6" delay={500}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Top Indian Cities
              </h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <SkeletonLoader className="w-full h-full" />
                </div>
              ) : regionData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No regional data available</p>
                    <p className="text-sm text-gray-400">Submit reports to see city statistics</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart 
                      data={regionData.slice(0, 6)}
                      onMouseEnter={onBarEnter}
                      onMouseLeave={onBarLeave}
                    >
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dc2626" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="region" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                        stroke="#64748b"
                      />
                      <YAxis stroke="#64748b" />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#dc2626"
                        strokeWidth={3}
                        fill="url(#areaGradient)"
                        animationBegin={0}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  {/* Modern Legend */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {regionData.slice(0, 6).map((region, index) => (
                      <div 
                        key={region.region} 
                        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                          hoveredBar === index ? 'bg-red-50 shadow-md' : 'hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setHoveredBar(index)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${getMarkerColor(region.severity)} 0%, ${getMarkerColor(region.severity)}80 100%)` 
                          }}
                        />
                        <span className="text-gray-700 font-medium truncate">
                          {region.region}
                        </span>
                        <span className="text-gray-500 text-xs ml-auto">
                          {region.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FloatingCard>

            {/* Modern Animated Category Pie Chart */}
            <FloatingCard className="p-6" delay={600}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Corruption Types in India
              </h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <SkeletonLoader variant="circular" className="w-32 h-32 mx-auto" />
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No category data available</p>
                    <p className="text-sm text-gray-400">Submit reports to see corruption types</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomLabel}
                        outerRadius={100}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                        animationBegin={0}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {categoryData.slice(0, 8).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke={activeIndex === index ? '#ffffff' : 'none'}
                            strokeWidth={activeIndex === index ? 3 : 0}
                            style={{
                              filter: activeIndex === index ? 'brightness(1.1) drop-shadow(0 0 10px rgba(0,0,0,0.3))' : 'none',
                              transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                              transformOrigin: 'center',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {categoryData.slice(0, 8).map((entry, index) => (
                      <div 
                        key={entry.key} 
                        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                          activeIndex === index ? 'bg-gray-100 shadow-md' : 'hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-700 font-medium truncate">
                          {entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FloatingCard>
          </div>
        </div>

        {/* Regional Details Table - Data Driven */}
        <FloatingCard className="mt-8 overflow-hidden" delay={700}>
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-semibold text-gray-900">Indian Cities Statistics</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time data from corruption reports database</p>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0">
                    <SkeletonLoader className="w-24 h-4" />
                    <SkeletonLoader className="w-16 h-4" />
                    <SkeletonLoader className="w-20 h-6" />
                    <SkeletonLoader className="w-32 h-4" />
                  </div>
                ))}
              </div>
            ) : regionData.length === 0 ? (
              <div className="p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Regional Data</h3>
                <p className="text-gray-500 mb-4">No corruption reports have been submitted yet.</p>
                <p className="text-sm text-gray-400">Be the first to report corruption in your area!</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {regionData.map((region, index) => (
                    <tr key={region.region} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-3 w-3 mr-3">
                            <div 
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: getMarkerColor(region.severity) }}
                            />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{region.region}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{region.count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm"
                          style={{ backgroundColor: getMarkerColor(region.severity) }}
                        >
                          {region.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Database (Live)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </FloatingCard>

        {/* India-specific Alert Section - Static Content */}
        <FloatingCard className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200" delay={800}>
          <div className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-orange-800 mb-3">
                  Real-Time Data from Database
                </h3>
                <p className="text-orange-700 leading-relaxed mb-3">
                  This heat map displays live data directly from our Supabase database. All corruption reports 
                  submitted through our platform are automatically processed and visualized here in real-time.
                </p>
                <p className="text-orange-700 leading-relaxed">
                  <strong>Data Source:</strong> Supabase PostgreSQL database with real-time updates. 
                  Last refreshed: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
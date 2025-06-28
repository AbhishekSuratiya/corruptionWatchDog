import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Map, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { RegionStats } from '../types';
import { SEVERITY_COLORS, CORRUPTION_CATEGORIES } from '../lib/constants';
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

// Modern color palette for corruption types
const MODERN_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint Green
  '#FFEAA7', // Warm Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Seafoam
  '#F7DC6F', // Golden Yellow
  '#BB8FCE', // Lavender
  '#85C1E9', // Light Blue
  '#F8C471', // Peach
  '#82E0AA'  // Light Green
];

export default function HeatMap() {
  const [regionData, setRegionData] = useState<RegionStats[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    // Simulate API calls for map and chart data
    const timer = setTimeout(() => {
      const mockRegionData: RegionStats[] = [
        { region: 'Mumbai', count: 45, latitude: 19.0760, longitude: 72.8777, severity: 'critical' },
        { region: 'Delhi', count: 38, latitude: 28.6139, longitude: 77.2090, severity: 'high' },
        { region: 'Bangalore', count: 32, latitude: 12.9716, longitude: 77.5946, severity: 'high' },
        { region: 'Chennai', count: 28, latitude: 13.0827, longitude: 80.2707, severity: 'medium' },
        { region: 'Kolkata', count: 25, latitude: 22.5726, longitude: 88.3639, severity: 'medium' },
        { region: 'Hyderabad', count: 22, latitude: 17.3850, longitude: 78.4867, severity: 'medium' },
        { region: 'Pune', count: 18, latitude: 18.5204, longitude: 73.8567, severity: 'low' },
        { region: 'Ahmedabad', count: 15, latitude: 23.0225, longitude: 72.5714, severity: 'low' }
      ];

      const mockCategoryData = Object.entries(CORRUPTION_CATEGORIES).map(([key, label], index) => ({
        name: label,
        value: Math.floor(Math.random() * 50) + 10,
        color: MODERN_COLORS[index % MODERN_COLORS.length],
        key: key
      }));

      setRegionData(mockRegionData);
      setCategoryData(mockCategoryData);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const getMarkerSize = (count: number) => {
    if (count >= 40) return 25;
    if (count >= 30) return 20;
    if (count >= 20) return 15;
    return 10;
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
            Corruption 
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"> Heat Map</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Real-time visualization of corruption density across regions. 
            Identify hotspots and track trends in your area.
          </p>
        </div>

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
              <FloatingCard className="p-6 text-center" delay={0}>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {regionData.reduce((sum, region) => sum + region.count, 0)}
                </div>
                <div className="text-gray-600">Total Reports</div>
              </FloatingCard>
              <FloatingCard className="p-6 text-center" delay={100}>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {regionData.length}
                </div>
                <div className="text-gray-600">Active Regions</div>
              </FloatingCard>
              <FloatingCard className="p-6 text-center" delay={200}>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {regionData.filter(r => r.severity === 'critical' || r.severity === 'high').length}
                </div>
                <div className="text-gray-600">High-Risk Areas</div>
              </FloatingCard>
              <FloatingCard className="p-6 text-center" delay={300}>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round((regionData.reduce((sum, region) => sum + region.count, 0) / regionData.length) * 100) / 100}
                </div>
                <div className="text-gray-600">Avg per Region</div>
              </FloatingCard>
            </>
          )}
        </div>

        {/* Map and Charts Grid - Data Driven */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <FloatingCard className="overflow-hidden" delay={400}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Map className="h-6 w-6 mr-2 text-blue-600" />
                  Regional Corruption Density
                </h2>
              </div>
              <div className="h-96">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <SkeletonLoader className="w-full h-full" />
                  </div>
                ) : (
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {regionData.map((region) => (
                      <CircleMarker
                        key={region.region}
                        center={[region.latitude, region.longitude]}
                        radius={getMarkerSize(region.count)}
                        fillColor={getMarkerColor(region.severity)}
                        color="#fff"
                        weight={2}
                        opacity={1}
                        fillOpacity={0.7}
                        eventHandlers={{
                          click: () => setSelectedRegion(region.region)
                        }}
                      >
                        <Popup>
                          <div className="text-center">
                            <h3 className="font-semibold text-lg">{region.region}</h3>
                            <p className="text-gray-600">{region.count} reports</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white mt-1`}
                                  style={{ backgroundColor: getMarkerColor(region.severity) }}>
                              {region.severity.toUpperCase()}
                            </span>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                )}
              </div>
              
              {/* Legend */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Severity Levels</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
                    <div key={severity} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-600 capitalize">{severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FloatingCard>
          </div>

          {/* Charts - Data Driven */}
          <div className="space-y-8">
            {/* Regional Bar Chart */}
            <FloatingCard className="p-6" delay={500}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Top Regions
              </h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <SkeletonLoader className="w-full h-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={regionData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="region" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </FloatingCard>

            {/* Modern Animated Category Pie Chart */}
            <FloatingCard className="p-6" delay={600}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Corruption Types Distribution
              </h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <SkeletonLoader variant="circular" className="w-32 h-32 mx-auto" />
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
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Regional Statistics</h2>
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
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {regionData.map((region) => (
                    <tr key={region.region} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{region.region}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{region.count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: getMarkerColor(region.severity) }}
                        >
                          {region.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                          +{Math.floor(Math.random() * 20)}% this month
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </FloatingCard>

        {/* Alert Section - Static Content */}
        <FloatingCard className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200" delay={800}>
          <div className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-800 mb-3">
                  High-Risk Areas Alert
                </h3>
                <p className="text-red-700 leading-relaxed">
                  The regions marked in red show critical levels of corruption reports. 
                  If you're in these areas, exercise extra caution and report any suspicious activities immediately.
                </p>
              </div>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
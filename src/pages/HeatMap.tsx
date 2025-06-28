import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Map, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { RegionStats } from '../types';
import { SEVERITY_COLORS, CORRUPTION_CATEGORIES } from '../lib/constants';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function HeatMap() {
  const [regionData, setRegionData] = useState<RegionStats[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - replace with actual API calls
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

    const mockCategoryData = Object.entries(CORRUPTION_CATEGORIES).map(([key, label]) => ({
      name: label,
      value: Math.floor(Math.random() * 50) + 10,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));

    setRegionData(mockRegionData);
    setCategoryData(mockCategoryData);
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <Map className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Corruption Heat Map
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time visualization of corruption density across regions. 
            Identify hotspots and track trends in your area.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {regionData.reduce((sum, region) => sum + region.count, 0)}
            </div>
            <div className="text-gray-600">Total Reports</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {regionData.length}
            </div>
            <div className="text-gray-600">Active Regions</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {regionData.filter(r => r.severity === 'critical' || r.severity === 'high').length}
            </div>
            <div className="text-gray-600">High-Risk Areas</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Math.round((regionData.reduce((sum, region) => sum + region.count, 0) / regionData.length) * 100) / 100}
            </div>
            <div className="text-gray-600">Avg per Region</div>
          </div>
        </div>

        {/* Map and Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Map className="h-6 w-6 mr-2 text-blue-600" />
                  Regional Corruption Density
                </h2>
              </div>
              <div className="h-96">
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
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-8">
            {/* Regional Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Top Regions
              </h3>
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
            </div>

            {/* Category Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Corruption Types
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Regional Details Table */}
        <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Regional Statistics</h2>
          </div>
          <div className="overflow-x-auto">
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
          </div>
        </div>

        {/* Alert Section */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                High-Risk Areas Alert
              </h3>
              <p className="text-red-700 leading-relaxed">
                The regions marked in red show critical levels of corruption reports. 
                If you're in these areas, exercise extra caution and report any suspicious activities immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

interface BeautifulChartProps {
  data: ChartData[];
  onAddDemoData?: () => void;
  onResetChart?: () => void;
}

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384',
  '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
];

export default function BeautifulChart({ data, onAddDemoData, onResetChart }: BeautifulChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalRakwa = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value.toFixed(2)} डिसमिल ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    if (data.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          कोई डेटा उपलब्ध नहीं है
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer transition-all duration-300 border-l-4 ${
              hoveredIndex === index 
                ? 'transform -translate-y-1 shadow-lg border-blue-500' 
                : 'shadow hover:shadow-md border-gray-300'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-medium text-gray-800">{entry.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {entry.value.toFixed(2)} डिसमिल
              </span>
              <Badge 
                variant="secondary" 
                className={`transition-all duration-300 ${
                  hoveredIndex === index ? 'bg-blue-100 text-blue-800' : ''
                }`}
              >
                {entry.percentage}%
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
            🌾 भू-अभिलेख - Chart Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
            <p className="text-sm text-blue-800 text-center">
              <strong>निर्देश:</strong> यह डेमो पेज सिर्फ chart को दिखाने के लिए है। 
              नीचे दिए गए बटन से डमी डेटा जोड़ें और chart को अपडेट होते देखें।
            </p>
          </div>

          {data.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart Container */}
              <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        innerRadius={72} // 60% cutout
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {data.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            stroke="#ffffff"
                            strokeWidth={2}
                            style={{
                              filter: hoveredIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend Container */}
              <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">विवरण</h3>
                <div className="max-h-80 overflow-y-auto">
                  <CustomLegend />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500 text-lg">कोई डेटा उपलब्ध नहीं है</p>
                <p className="text-gray-400 text-sm mt-2">
                  डमी डेटा जोड़ने के लिए नीचे दिए गए बटन पर क्लिक करें
                </p>
              </div>
            </div>
          )}

          {data.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">कुल रकवा:</span>
                <Badge variant="default" className="text-lg px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600">
                  {totalRakwa.toFixed(2)} डिसमिल
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={onAddDemoData}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="mr-2">➕</span>
              डमी डेटा जोड़ें
            </Button>
            <Button
              onClick={onResetChart}
              variant="destructive"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="mr-2">🔄</span>
              चार्ट रीसेट करें
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
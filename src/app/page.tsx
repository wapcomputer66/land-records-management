'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import * as XLSX from 'xlsx';
import BeautifulChart from '@/components/BeautifulChart';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Raiyat {
  id: string;
  name: string;
}

interface LandRecord {
  id: string;
  timestamp: string;
  raiyatId: string;
  raiyatName: string;
  jamabandiNumber?: string;
  khataNumber?: string;
  khesraNumber: string;
  rakwa?: string;
  uttar?: string;
  dakshin?: string;
  purab?: string;
  paschim?: string;
  remarks?: string;
}

interface Project {
  id: string;
  name: string;
  created: string;
  raiyatNames: Raiyat[];
  landRecords: LandRecord[];
  raiyatColors: Record<string, string>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // Auth form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  
  // App states
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [syncStatus, setSyncStatus] = useState('✅ सिंक हो गया');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    raiyatName: '',
    jamabandiNumber: '',
    khataNumber: '',
    khesraNumber: '',
    rakwa: '',
    uttar: '',
    dakshin: '',
    purab: '',
    paschim: '',
    remarks: ''
  });
  
  // Project management
  const [newProjectName, setNewProjectName] = useState('');
  const [newRaiyatName, setNewRaiyatName] = useState('');
  
  // UI states
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showRecordView, setShowRecordView] = useState(false);
  const [showEditRecord, setShowEditRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LandRecord | null>(null);
  const [currentRaiyatFilter, setCurrentRaiyatFilter] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0] || null;

  // Load user from localStorage on mount and check auth
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedProjectId = localStorage.getItem('currentProjectId');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    
    if (savedProjectId) {
      setCurrentProjectId(savedProjectId);
    }
  }, []);

  // Save currentProjectId to localStorage when it changes
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('currentProjectId', currentProjectId);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  }, [currentProjectId]);

  // Load projects when user changes
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/projects?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
          if (data.projects?.length > 0 && !currentProjectId) {
            setCurrentProjectId(data.projects[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    if (user) {
      loadProjects();
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Auth functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setAuthSuccess('लॉगिन सफल!');
      } else {
        setAuthError(data.error || 'लॉगिन विफल');
      }
    } catch (error) {
      setAuthError('नेटवर्क त्रुटि');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    
    if (signupPassword !== signupConfirmPassword) {
      setAuthError('पासवर्ड मेल नहीं खा रहे हैं');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: signupName, 
          email: signupEmail, 
          password: signupPassword 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setAuthSuccess('अकाउंट सफलतापूर्वक बनाया गया!');
      } else {
        setAuthError(data.error || 'साइनअप विफल');
      }
    } catch (error) {
      setAuthError('नेटवर्क त्रुटि');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentProjectId(null);
    setProjects([]);
    setAuthError('');
    setAuthSuccess('');
    localStorage.removeItem('user');
    localStorage.removeItem('currentProjectId');
  };

  // Auto-sync function
  const autoSync = async () => {
    if (!user || isSyncing) return;
    
    setIsSyncing(true);
    setSyncStatus('🔄 ऑटो-सिंक हो रहा है...');
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload projects to get latest data
      const response = await fetch(`/api/projects?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        setLastSyncTime(new Date());
        setSyncStatus('✅ ऑटो-सिंक हो गया');
      } else {
        throw new Error('Auto sync failed');
      }
    } catch (error) {
      setSyncStatus('❌ ऑटो-सिंक विफल');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const autoSyncInterval = setInterval(() => {
      autoSync();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSyncInterval);
  }, [user, isSyncing]);

  // Project functions
  const createProject = async () => {
    if (!newProjectName.trim() || !user) return;
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, userId: user.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects([...projects, data.project]);
        setCurrentProjectId(data.project.id);
        setNewProjectName('');
        setSyncStatus('🔄 सिंक हो रहा है...');
        setTimeout(() => {
          setSyncStatus('✅ सिंक हो गया');
          setLastSyncTime(new Date());
        }, 1000);
        toast({ title: 'सफलता', description: 'नया प्रोजेक्ट बनाया गया' });
      } else {
        const errorData = await response.json();
        toast({ title: 'त्रुटि', description: errorData.error || 'प्रोजेक्ट बनाने में विफल' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'प्रोजेक्ट बनाने में विफल' });
    }
  };

  const updateProject = async (projectId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === projectId ? data.project : p
        ));
        setEditingProjectId(null);
        setEditingProjectName('');
        toast({ title: 'सफलता', description: 'प्रोजेक्ट नाम अपडेट किया गया' });
      } else {
        const errorData = await response.json();
        toast({ title: 'त्रुटि', description: errorData.error || 'प्रोजेक्ट अपडेट करने में विफल' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'प्रोजेक्ट अपडेट करने में विफल' });
    }
  };

  const deleteProject = async (projectId: string) => {
    if (projects.length <= 1) {
      toast({ title: 'त्रुटि', description: 'कम से कम एक प्रोजेक्ट होना चाहिए' });
      return;
    }
    
    setProjectToDelete(projectId);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await fetch(`/api/projects/${projectToDelete}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const updatedProjects = projects.filter(p => p.id !== projectToDelete);
        setProjects(updatedProjects);
        if (projectToDelete === currentProjectId) {
          const newProjectId = updatedProjects[0]?.id || null;
          setCurrentProjectId(newProjectId);
        }
        setSyncStatus('🔄 सिंक हो रहा है...');
        setTimeout(() => {
          setSyncStatus('✅ सिंक हो गया');
          setLastSyncTime(new Date());
        }, 1000);
        toast({ title: 'सफलता', description: 'प्रोजेक्ट डिलीट किया गया' });
        setProjectToDelete(null);
      } else {
        const errorData = await response.json();
        toast({ title: 'त्रुटि', description: errorData.error || 'प्रोजेक्ट डिलीट करने में विफल' });
        setProjectToDelete(null);
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'प्रोजेक्ट डिलीट करने में विफल' });
      setProjectToDelete(null);
    }
  };

  const switchToProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setActiveTab('form');
  };

  // Raiyat functions
  const addRaiyat = async () => {
    if (!newRaiyatName.trim() || !currentProjectId) return;
    
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/raiyat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRaiyatName })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === currentProjectId ? data.project : p
        ));
        setNewRaiyatName('');
        toast({ title: 'सफलता', description: 'रैयत नाम जोड़ा गया' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'रैयत नाम जोड़ने में विफल' });
    }
  };

  const deleteRaiyat = async (raiyatId: string) => {
    if (!currentProjectId) return;
    
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/raiyat/${raiyatId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === currentProjectId ? data.project : p
        ));
        toast({ title: 'सफलता', description: 'रैयत नाम डिलीट किया गया' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'रैयत नाम डिलीट करने में विफल' });
    }
  };

  // Land record functions
  const submitLandRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProjectId || !formData.raiyatName || !formData.khesraNumber) {
      toast({ title: 'त्रुटि', description: 'कृपया सभी आवश्यक फील्ड्स भरें' });
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === currentProjectId ? data.project : p
        ));
        setSyncStatus('🔄 सिंक हो रहा है...');
        setTimeout(() => {
          setSyncStatus('✅ सिंक हो गया');
          setLastSyncTime(new Date());
        }, 1000);
        setShowSuccessPopup(true);
        setFormData({
          raiyatName: '',
          jamabandiNumber: '',
          khataNumber: '',
          khesraNumber: '',
          rakwa: '',
          uttar: '',
          dakshin: '',
          purab: '',
          paschim: '',
          remarks: ''
        });
      } else {
        const errorData = await response.json();
        toast({ title: 'त्रुटि', description: errorData.error || 'रिकॉर्ड सेव करने में विफल' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'नेटवर्क त्रुटि' });
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!currentProjectId) return;
    
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/records/${recordId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === currentProjectId ? data.project : p
        ));
        setShowRecordView(false);
        toast({ title: 'सफलता', description: 'रिकॉर्ड डिलीट किया गया' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'रिकॉर्ड डिलीट करने में विफल' });
    }
  };

  const updateRecord = async (updatedData: Partial<LandRecord>) => {
    if (!currentProjectId || !selectedRecord) return;
    
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/records/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === currentProjectId ? data.project : p
        ));
        setShowEditRecord(false);
        setShowRecordView(false);
        toast({ title: 'सफलता', description: 'रिकॉर्ड अपडेट किया गया' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'रिकॉर्ड अपडेट करने में विफल' });
    }
  };

  // Export functions
  const exportCurrentProject = async () => {
    if (!currentProjectId) return;
    
    try {
      const response = await fetch(`/api/projects/${currentProjectId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProject?.name || 'project'}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: 'सफलता', description: 'डेटा एक्सपोर्ट हो गया' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'एक्सपोर्ट करने में विफल' });
    }
  };

  const handleFileImport = async () => {
    if (!importFile || !currentProjectId) return;
    
    setIsImporting(true);
    
    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Map Excel columns to our field names
      const records = jsonData.map((row: any) => ({
        raiyatName: row['रैयत नाम'] || row['raiyatName'] || '',
        jamabandiNumber: row['जमाबंदी नंबर'] || row['jamabandiNumber'] || '',
        khataNumber: row['खाता नंबर'] || row['khataNumber'] || '',
        khesraNumber: row['खेसरा नंबर'] || row['khesraNumber'] || '',
        rakwa: row['रकवा'] || row['rakwa'] || '',
        uttar: row['उत्तर'] || row['uttar'] || '',
        dakshin: row['दक्षिण'] || row['dakshin'] || '',
        purab: row['पूर्व'] || row['purab'] || '',
        paschim: row['पश्चिम'] || row['paschim'] || '',
        remarks: row['टिप्पणी'] || row['remarks'] || ''
      })).filter(record => record.raiyatName && record.khesraNumber);
      
      const response = await fetch(`/api/projects/${currentProjectId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === currentProjectId ? data.project : p
        ));
        
        toast({ 
          title: 'इंपोर्ट सफल', 
          description: `${data.createdCount} रिकॉर्ड इंपोर्ट हुए, ${data.errorCount} त्रुटियां` 
        });
        
        if (data.errors.length > 0) {
          console.log('Import errors:', data.errors);
        }
        
        setImportFile(null);
      } else {
        const errorData = await response.json();
        toast({ title: 'त्रुटि', description: errorData.error || 'इंपोर्ट विफल' });
      }
    } catch (error) {
      toast({ title: 'त्रुटि', description: 'फाइल पढ़ने में विफल' });
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    if (!currentProject) return { totalRaiyat: 0, totalRecords: 0, totalArea: 0 };
    
    const records = currentProject.landRecords || [];
    const totalRecords = records.length;
    const totalArea = records.reduce((sum, record) => sum + (parseFloat(record.rakwa || '0')), 0);
    const totalRaiyat = new Set(records.map(record => record.raiyatName).filter(name => name)).size;
    
    return { totalRaiyat, totalRecords, totalArea };
  };

  const stats = calculateStats();

  // Generate chart data for circle chart
  const getChartData = () => {
    if (!currentProject) return [];
    
    const raiyatData: Record<string, number> = {};
    currentProject.landRecords.forEach(record => {
      if (record.raiyatName && record.rakwa) {
        const rakwa = parseFloat(record.rakwa) || 0;
        raiyatData[record.raiyatName] = (raiyatData[record.raiyatName] || 0) + rakwa;
      }
    });
    
    const totalRakwa = Object.values(raiyatData).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(raiyatData).map(([name, value], index) => ({
      name,
      value,
      percentage: totalRakwa > 0 ? Math.round((value / totalRakwa) * 100) : 0
    }));
  };

  const chartData = getChartData();

  // Demo functions for beautiful chart
  const [demoChartData, setDemoChartData] = useState<any[]>([]);

  const addDemoData = () => {
    const raiyatNames = [
      'राम कुमार', 'सुरेश यादव', 'अनीता देवी', 
      'मोहन लाल', 'गीता सिंह', 'राजेश वर्मा'
    ];
    
    const randomIndex = Math.floor(Math.random() * raiyatNames.length);
    const newRaiyat = raiyatNames[randomIndex];
    const newRakwa = parseFloat((Math.random() * 50 + 10).toFixed(2));
    
    setDemoChartData(prev => {
      const existingIndex = prev.findIndex(item => item.name === newRaiyat);
      
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].value += newRakwa;
        return updated;
      } else {
        return [...prev, { name: newRaiyat, value: newRakwa }];
      }
    });
  };

  const resetChart = () => {
    setDemoChartData([]);
  };

  // Calculate percentages for demo data
  const demoDataWithPercentages = demoChartData.map(item => {
    const total = demoChartData.reduce((sum, d) => sum + d.value, 0);
    return {
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    };
  });

  // If not logged in, show auth screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8 text-center">
            <div className="text-6xl mb-3">🌾</div>
            <h1 className="text-3xl font-bold mb-2">भू-अभिलेख</h1>
            <p className="text-teal-100">भूमि अभिलेख प्रबंधन प्रणाली</p>
          </div>
          
          <div className="flex bg-emerald-50 border-b-2 border-emerald-200">
            <button
              className={`flex-1 py-4 font-semibold transition-all ${authMode === 'login' ? 'bg-white text-emerald-600 border-b-3 border-emerald-600' : 'text-gray-600'}`}
              onClick={() => setAuthMode('login')}
            >
              लॉगिन
            </button>
            <button
              className={`flex-1 py-4 font-semibold transition-all ${authMode === 'signup' ? 'bg-white text-emerald-600 border-b-3 border-emerald-600' : 'text-gray-600'}`}
              onClick={() => setAuthMode('signup')}
            >
              साइन अप
            </button>
          </div>
          
          <div className="p-6">
            {authError && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{authError}</AlertDescription>
              </Alert>
            )}
            
            {authSuccess && (
              <Alert className="mb-4 border-emerald-200 bg-emerald-50">
                <AlertDescription className="text-emerald-700">{authSuccess}</AlertDescription>
              </Alert>
            )}
            
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="loginEmail">ईमेल एड्रेस</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="loginPassword">पासवर्ड</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'लोड हो रहा है...' : 'लॉगिन करें'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signupName">पूरा नाम</Label>
                  <Input
                    id="signupName"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="आपका पूरा नाम"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signupEmail">ईमेल एड्रेस</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signupPassword">पासवर्ड</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="कम से कम 6 अक्षर"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signupConfirmPassword">पासवर्ड पुष्टि करें</Label>
                  <Input
                    id="signupConfirmPassword"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="पासवर्ड दोबारा दर्ज करें"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'लोड हो रहा है...' : 'अकाउंट बनाएं'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main app UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex justify-between items-center">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🌾</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">भू-अभिलेख</h1>
                  <p className="text-emerald-100 text-sm">Land Record Management System</p>
                </div>
              </div>

              {/* User Section */}
              <div className="flex items-center space-x-6">
                {/* Status Indicator */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Online</span>
                </div>

                {/* Enhanced Sync Status - Auto Only */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-300 ${
                  isSyncing ? 'animate-pulse' : ''
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isSyncing ? 'bg-yellow-400 animate-spin' : 'bg-green-400'
                  }`}></div>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {isSyncing ? 'ऑटो-सिंक हो रहा है...' : syncStatus}
                  </span>
                </div>

                {/* Last Sync Time */}
                {lastSyncTime && (
                  <div className="hidden lg:block text-xs text-emerald-100">
                    आखिरी सिंक: {lastSyncTime.toLocaleTimeString('hi-IN')}
                  </div>
                )}

                {/* User Profile */}
                <div className="flex items-center space-x-3 pl-4 border-l border-white/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center font-bold shadow-lg border border-white/20">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold text-sm">{user.name || user.email}</div>
                    <div className="text-emerald-100 text-xs">Amin</div>
                  </div>
                </div>

                {/* Logout Button */}
                <Button 
                  variant="secondary" 
                  onClick={handleLogout} 
                  className="bg-red-500 hover:bg-red-600 text-white border-red-600 backdrop-blur-sm transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-red-500/25"
                >
                  <span className="mr-2">🚪</span>
                  <span className="hidden sm:inline">लॉगआउट</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stylish Project Info Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-700/60 via-teal-700/60 to-cyan-700/60 backdrop-blur-md border-t border-white/10">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-8">
                {/* Enhanced Current Project */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                  <div className="relative flex items-center space-x-4 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xl">📁</span>
                    </div>
                    <div>
                      <div className="font-bold text-lg bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                        {currentProject?.name || 'कोई प्रोजेक्ट नहीं चुना गया'}
                      </div>
                      <div className="text-emerald-100 text-xs font-medium">Active Project</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Stats with Glass Cards */}
                <div className="hidden md:flex items-center space-x-3">
                  {/* Raiyat Card */}
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                    <div className="relative flex items-center space-x-3 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-sm">👥</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{stats.totalRaiyat}</div>
                        <div className="text-xs text-blue-200">रैयत</div>
                      </div>
                    </div>
                  </div>

                  {/* Records Card */}
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                    <div className="relative flex items-center space-x-3 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-sm">📊</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{stats.totalRecords}</div>
                        <div className="text-xs text-green-200">रिकॉर्ड्स</div>
                      </div>
                    </div>
                  </div>

                  {/* Area Card */}
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                    <div className="relative flex items-center space-x-3 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-sm">📏</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{stats.totalArea.toFixed(2)}</div>
                        <div className="text-xs text-pink-200">रकवा</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="flex items-center space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setActiveTab('projects')} 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-yellow-500/25 font-semibold"
                >
                  <span className="mr-2">🔄</span>
                  प्रोजेक्ट बदलें
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 p-1 rounded-xl">
              <TabsTrigger 
                value="projects" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/70"
              >
                <span className="mr-2">📁</span>
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="form" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/70"
              >
                <span className="mr-2">📝</span>
                फॉर्म
              </TabsTrigger>
              <TabsTrigger 
                value="records" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/70"
              >
                <span className="mr-2">📊</span>
                रिकॉर्ड्स
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-white/70"
              >
                <span className="mr-2">⚙️</span>
                एडमिन
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>📁 Projects Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">नया प्रोजेक्ट बनाएं</h3>
                  <div className="flex space-x-3">
                    <Input
                      placeholder="नया प्रोजेक्ट नाम दर्ज करें"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="max-w-md"
                    />
                    <Button onClick={createProject}>➕ प्रोजेक्ट बनाएं</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => {
                    const isActive = project.id === currentProjectId;
                    const projectStats = {
                      raiyatCount: new Set(project.landRecords.map(r => r.raiyatName)).size,
                      recordCount: project.landRecords.length,
                      area: project.landRecords.reduce((sum, r) => sum + (parseFloat(r.rakwa || '0')), 0).toFixed(2)
                    };
                    
                    return (
                      <Card key={project.id} className={`${isActive ? 'border-green-500 bg-green-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            {editingProjectId === project.id ? (
                              <div className="flex items-center space-x-2 flex-1">
                                <Input
                                  value={editingProjectName}
                                  onChange={(e) => setEditingProjectName(e.target.value)}
                                  className="flex-1"
                                  placeholder="प्रोजेक्ट नाम"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateProject(project.id, editingProjectName)}
                                >
                                  ✅
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProjectId(null);
                                    setEditingProjectName('');
                                  }}
                                >
                                  ❌
                                </Button>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-bold text-lg">{project.name}</h4>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingProjectId(project.id);
                                      setEditingProjectName(project.name);
                                    }}
                                  >
                                    ✏️
                                  </Button>
                                  <Badge variant={isActive ? 'default' : 'secondary'}>
                                    {isActive ? 'सक्रिय' : 'निष्क्रिय'}
                                  </Badge>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                            <div className="text-center p-2 bg-gray-100 rounded">
                              <div className="font-bold">{projectStats.raiyatCount}</div>
                              <div className="text-gray-600">रैयत</div>
                            </div>
                            <div className="text-center p-2 bg-gray-100 rounded">
                              <div className="font-bold">{projectStats.recordCount}</div>
                              <div className="text-gray-600">रिकॉर्ड्स</div>
                            </div>
                            <div className="text-center p-2 bg-gray-100 rounded">
                              <div className="font-bold">{projectStats.area}</div>
                              <div className="text-gray-600">रकवा</div>
                            </div>
                            <div className="text-center p-2 bg-gray-100 rounded">
                              <div className="font-bold text-xs">{new Date(project.created).toLocaleDateString('hi-IN')}</div>
                              <div className="text-gray-600">बनाया गया</div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => switchToProject(project.id)}
                              className="flex-1"
                            >
                              🔄 चुनें
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteProject(project.id)}
                              className="flex-1"
                            >
                              🗑️ डिलीट
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Tab */}
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>🌾 भू-अभिलेख फॉर्म</CardTitle>
                <p className="text-sm text-gray-600">
                  वर्तमान प्रोजेक्ट: {currentProject?.name || 'कोई प्रोजेक्ट नहीं'}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitLandRecord} className="space-y-6">
                  {/* रैयत की जानकारी */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">👤 रैयत की जानकारी</h3>
                    <div>
                      <Label htmlFor="raiyatName">1. रैयत का नाम</Label>
                      <Select value={formData.raiyatName} onValueChange={(value) => setFormData({...formData, raiyatName: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="-- चुनें --" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentProject?.raiyatNames.map((raiyat) => (
                            <SelectItem key={raiyat.id} value={raiyat.id}>
                              {raiyat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* जमीन का विवरण */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">📄 जमीन का विवरण</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jamabandiNumber">2. जमाबंदी नंबर</Label>
                        <Input
                          id="jamabandiNumber"
                          type="number"
                          value={formData.jamabandiNumber}
                          onChange={(e) => setFormData({...formData, jamabandiNumber: e.target.value})}
                          placeholder="जमाबंदी नंबर दर्ज करें"
                        />
                      </div>
                      <div>
                        <Label htmlFor="khataNumber">3. खाता नंबर</Label>
                        <Input
                          id="khataNumber"
                          type="number"
                          value={formData.khataNumber}
                          onChange={(e) => setFormData({...formData, khataNumber: e.target.value})}
                          placeholder="खाता नंबर दर्ज करें"
                        />
                      </div>
                      <div>
                        <Label htmlFor="khesraNumber">4. खेसरा नंबर *</Label>
                        <Input
                          id="khesraNumber"
                          type="number"
                          value={formData.khesraNumber}
                          onChange={(e) => setFormData({...formData, khesraNumber: e.target.value})}
                          placeholder="खेसरा नंबर दर्ज करें"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="rakwa">5. रकवा (डिसमिल में)</Label>
                        <Input
                          id="rakwa"
                          type="number"
                          step="0.01"
                          value={formData.rakwa}
                          onChange={(e) => setFormData({...formData, rakwa: e.target.value})}
                          placeholder="रकवा दर्ज करें"
                        />
                      </div>
                    </div>
                  </div>

                  {/* चौहद्दी विवरण */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">🗺️ चौहद्दी विवरण</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="uttar">6. उत्तर</Label>
                        <Input
                          id="uttar"
                          value={formData.uttar}
                          onChange={(e) => setFormData({...formData, uttar: e.target.value})}
                          placeholder="उत्तर दिशा"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dakshin">7. दक्षिण</Label>
                        <Input
                          id="dakshin"
                          value={formData.dakshin}
                          onChange={(e) => setFormData({...formData, dakshin: e.target.value})}
                          placeholder="दक्षिण दिशा"
                        />
                      </div>
                      <div>
                        <Label htmlFor="purab">8. पूर्व</Label>
                        <Input
                          id="purab"
                          value={formData.purab}
                          onChange={(e) => setFormData({...formData, purab: e.target.value})}
                          placeholder="पूर्व दिशा"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paschim">9. पश्चिम</Label>
                        <Input
                          id="paschim"
                          value={formData.paschim}
                          onChange={(e) => setFormData({...formData, paschim: e.target.value})}
                          placeholder="पश्चिम दिशा"
                        />
                      </div>
                    </div>
                  </div>

                  {/* अतिरिक्त जानकारी */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">📝 अतिरिक्त जानकारी</h3>
                    <div>
                      <Label htmlFor="remarks">10. रिमार्क्स</Label>
                      <Textarea
                        id="remarks"
                        rows={3}
                        value={formData.remarks}
                        onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                        placeholder="अन्य टिप्पणियाँ दर्ज करें"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    ✅ सबमिट करें
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>📊 सभी रिकॉर्ड्स</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">👥</div>
                      <div className="text-3xl font-bold">{stats.totalRaiyat}</div>
                      <div>कुल रैयत</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">📋</div>
                      <div className="text-3xl font-bold">{stats.totalRecords}</div>
                      <div>कुल रिकॉर्ड्स</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">📏</div>
                      <div className="text-3xl font-bold">{stats.totalArea.toFixed(2)}</div>
                      <div>कुल रकवा (डिसमिल)</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Beautiful Chart */}
                <BeautifulChart
                  data={demoDataWithPercentages}
                  onAddDemoData={addDemoData}
                  onResetChart={resetChart}
                />

                {/* Filter by Raiyat */}
                <div className="mb-6">
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="raiyatFilter">रैयत के अनुसार फिल्टर करें:</Label>
                    <Select value={currentRaiyatFilter || 'all'} onValueChange={(value) => setCurrentRaiyatFilter(value === 'all' ? null : value)}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="सभी रैयत" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">सभी रैयत</SelectItem>
                        {Array.from(new Set(currentProject?.landRecords.map(r => r.raiyatName).filter(Boolean) || [])).map(raiyatName => (
                          <SelectItem key={raiyatName} value={raiyatName}>
                            {raiyatName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentRaiyatFilter && (
                      <Button variant="outline" onClick={() => setCurrentRaiyatFilter(null)}>
                        ❌ क्लियर करें
                      </Button>
                    )}
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button onClick={exportCurrentProject}>
                    📥 Current Project Export
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-64"
                    />
                    <Button 
                      onClick={handleFileImport} 
                      disabled={!importFile || isImporting}
                    >
                      {isImporting ? '🔄 इंपोर्ट हो रहा है...' : '📤 इंपोर्ट करें'}
                    </Button>
                  </div>
                </div>

                {/* Records Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="border border-gray-300 p-2">क्र.</th>
                        <th className="border border-gray-300 p-2">रैयत नाम</th>
                        <th className="border border-gray-300 p-2">जमाबंदी नंबर</th>
                        <th className="border border-gray-300 p-2">खाता नंबर</th>
                        <th className="border border-gray-300 p-2">खेसरा नंबर</th>
                        <th className="border border-gray-300 p-2">रकवा</th>
                        <th className="border border-gray-300 p-2">उत्तर</th>
                        <th className="border border-gray-300 p-2">दक्षिण</th>
                        <th className="border border-gray-300 p-2">पूर्व</th>
                        <th className="border border-gray-300 p-2">पश्चिम</th>
                        <th className="border border-gray-300 p-2">रिमार्क्स</th>
                        <th className="border border-gray-300 p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProject?.landRecords
                        .filter(record => !currentRaiyatFilter || record.raiyatName === currentRaiyatFilter)
                        .map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">{index + 1}</td>
                          <td className="border border-gray-300 p-2 font-semibold">{record.raiyatName}</td>
                          <td className="border border-gray-300 p-2">{record.jamabandiNumber || '-'}</td>
                          <td className="border border-gray-300 p-2">{record.khataNumber || '-'}</td>
                          <td className="border border-gray-300 p-2">{record.khesraNumber}</td>
                          <td className="border border-gray-300 p-2">{record.rakwa || '0'} डिसमिल</td>
                          <td className="border border-gray-300 p-2">{record.uttar || '-'}</td>
                          <td className="border border-gray-300 p-2">{record.dakshin || '-'}</td>
                          <td className="border border-gray-300 p-2">{record.purab || '-'}</td>
                          <td className="border border-gray-300 p-2">{record.paschim || '-'}</td>
                          <td className="border border-gray-300 p-2">{record.remarks || '-'}</td>
                          <td className="border border-gray-300 p-2">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowRecordView(true);
                                }}
                              >
                                👁️
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRecord(record.id)}
                              >
                                🗑️
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!currentProject?.landRecords || currentProject.landRecords.length === 0) && (
                    <div className="text-center p-8 text-gray-500">
                      कोई रिकॉर्ड नहीं मिला
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>⚙️ एडमिन पैनल</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Raiyat Management */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">👥 रैयत नाम प्रबंधन</h3>
                  <div className="flex space-x-3 mb-4">
                    <Input
                      placeholder="नया रैयत नाम दर्ज करें"
                      value={newRaiyatName}
                      onChange={(e) => setNewRaiyatName(e.target.value)}
                      className="max-w-md"
                    />
                    <Button onClick={addRaiyat}>➕ जोड़ें</Button>
                  </div>
                  
                  <div className="space-y-2">
                    {currentProject?.raiyatNames.map((raiyat) => (
                      <div key={raiyat.id} className="flex justify-between items-center p-3 border rounded">
                        <span>{raiyat.name}</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRaiyat(raiyat.id)}
                        >
                          🗑️ डिलीट
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Management */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">💾 डेटा प्रबंधन</h3>
                  <div className="flex flex-wrap gap-3">
                    <p className="text-gray-600">केवल current project export available है</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Success Popup */}
      <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
        <DialogContent>
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">सफलता!</h2>
            <p className="mb-4">आपका फॉर्म सफलतापूर्वक सबमिट हो गया है। धन्यवाद!</p>
            <Button onClick={() => setShowSuccessPopup(false)}>
              👍 ठीक है
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record View Popup */}
      <Dialog open={showRecordView} onOpenChange={setShowRecordView}>
        <DialogContent className="max-w-2xl">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">रिकॉर्ड की पूरी जानकारी</h2>
          </div>
          
          {selectedRecord && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div><strong>📅 तारीख:</strong> {selectedRecord.timestamp}</div>
              <div><strong>👤 रैयत नाम:</strong> {selectedRecord.raiyatName}</div>
              <div><strong>🔢 जमाबंदी नंबर:</strong> {selectedRecord.jamabandiNumber || 'नहीं दिया'}</div>
              <div><strong>📋 खाता नंबर:</strong> {selectedRecord.khataNumber || 'नहीं दिया'}</div>
              <div><strong>🏷️ खेसरा नंबर:</strong> {selectedRecord.khesraNumber}</div>
              <div><strong>📏 रकवा:</strong> {selectedRecord.rakwa || 'नहीं दिया'} डिसमिल</div>
              <div>
                <strong>🗺️ चौहद्दी:</strong>
                <div className="ml-4">
                  <div>• उत्तर: {selectedRecord.uttar || 'नहीं दिया'}</div>
                  <div>• दक्षिण: {selectedRecord.dakshin || 'नहीं दिया'}</div>
                  <div>• पूर्व: {selectedRecord.purab || 'नहीं दिया'}</div>
                  <div>• पश्चिम: {selectedRecord.paschim || 'नहीं दिया'}</div>
                </div>
              </div>
              <div><strong>💬 रिमार्क्स:</strong> {selectedRecord.remarks || 'नहीं दिया'}</div>
            </div>
          )}
          
          <div className="flex justify-center space-x-3 mt-6">
            <Button
              onClick={() => {
                setShowEditRecord(true);
                setShowRecordView(false);
              }}
            >
              ✏️ एडिट करें
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRecord && deleteRecord(selectedRecord.id)}
            >
              🗑️ डिलीट
            </Button>
            <Button onClick={() => setShowRecordView(false)}>
              ✖️ बंद करें
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Record Popup */}
      <Dialog open={showEditRecord} onOpenChange={setShowEditRecord}>
        <DialogContent className="max-w-2xl">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">✏️</div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">रिकॉर्ड एडिट करें</h2>
          </div>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <Label>रैयत नाम</Label>
                <Select 
                  value={selectedRecord.raiyatId} 
                  onValueChange={(value) => setSelectedRecord({...selectedRecord, raiyatId: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProject?.raiyatNames.map((raiyat) => (
                      <SelectItem key={raiyat.id} value={raiyat.id}>
                        {raiyat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>जमाबंदी नंबर</Label>
                  <Input
                    type="number"
                    value={selectedRecord.jamabandiNumber || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, jamabandiNumber: e.target.value})}
                  />
                </div>
                <div>
                  <Label>खाता नंबर</Label>
                  <Input
                    type="number"
                    value={selectedRecord.khataNumber || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, khataNumber: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>खेसरा नंबर</Label>
                  <Input
                    type="number"
                    value={selectedRecord.khesraNumber}
                    onChange={(e) => setSelectedRecord({...selectedRecord, khesraNumber: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>रकवा (डिसमिल)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedRecord.rakwa || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, rakwa: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>उत्तर</Label>
                  <Input
                    value={selectedRecord.uttar || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, uttar: e.target.value})}
                  />
                </div>
                <div>
                  <Label>दक्षिण</Label>
                  <Input
                    value={selectedRecord.dakshin || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, dakshin: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>पूर्व</Label>
                  <Input
                    value={selectedRecord.purab || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, purab: e.target.value})}
                  />
                </div>
                <div>
                  <Label>पश्चिम</Label>
                  <Input
                    value={selectedRecord.paschim || ''}
                    onChange={(e) => setSelectedRecord({...selectedRecord, paschim: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label>रिमार्क्स</Label>
                <Textarea
                  rows={3}
                  value={selectedRecord.remarks || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, remarks: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-center space-x-3 mt-6">
            <Button onClick={() => selectedRecord && updateRecord(selectedRecord)}>
              ✅ अपडेट करें
            </Button>
            <Button variant="secondary" onClick={() => setShowEditRecord(false)}>
              ✖️ रद्द करें
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="max-w-md">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">प्रोजेक्ट डिलीट करें?</h2>
            <p className="text-gray-600 mb-4">
              क्या आप वाकई इस प्रोजेक्ट को डिलीट करना चाहते हैं? 
              इससे सभी land records भी डिलीट हो जाएंगे!
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setProjectToDelete(null)}
              className="flex-1"
            >
              ❌ रद्द करें
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteProject}
              className="flex-1"
            >
              🗑️ डिलीट करें
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
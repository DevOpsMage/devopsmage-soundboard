'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Upload, Trash2, Plus, Save, Settings, Home, Eye, EyeOff, Sun, Moon, LogOut } from 'lucide-react';
import { SoundboardConfig, Category, Sound } from '@/lib/types';
import { ThemeProvider, useTheme } from '../components/theme-provider';

function AdminContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState<SoundboardConfig | null>(null);
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const result = await response.json();
      
      if (result.success && result.data.authenticated) {
        setIsAuthenticated(true);
        await fetchData();
      } else {
        setIsAuthenticated(false);
        // Clear any stored password
        sessionStorage.removeItem('admin-password');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configResponse, filesResponse] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/audio-files'),
      ]);

      const configResult = await configResponse.json();
      const filesResult = await filesResponse.json();

      if (configResult.success) {
        setConfig(configResult.data);
      }
      if (filesResult.success) {
        setAudioFiles(filesResult.data);
      } else if (filesResponse.status === 401) {
        // Session expired, redirect to login
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin-password');
        setError('Session expired. Please log in again.');
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem('admin-password', password);
        setIsAuthenticated(true);
        await fetchData();
      } else {
        setError(result.error?.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    const formData = new FormData();
    uploadFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      setLoading(true);
      setUploadProgress(`Uploading ${uploadFiles.length} file(s)...`);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadFiles([]);
        await fetchData();
        
        // Show detailed results
        if (result.data.summary) {
          const { total, success, failed } = result.data.summary;
          if (failed > 0) {
            setError(`${success}/${total} files uploaded successfully. ${failed} files failed.`);
            setUploadProgress(null);
            
            // Show specific errors for failed files
            const failedFiles = result.data.results
              .filter((r: any) => !r.success)
              .map((r: any) => `${r.filename}: ${r.error}`)
              .join('\n');
            
            if (failedFiles) {
              console.warn('Failed uploads:', failedFiles);
            }
          } else {
            setError(null);
            setUploadProgress(`All ${total} files uploaded successfully!`);
            setTimeout(() => setUploadProgress(null), 3000);
          }
        }
      } else {
        setError(result.error?.message || 'Upload failed');
        setUploadProgress(null);
      }
    } catch (err) {
      setError('Upload failed');
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      setLoading(true);
      const response = await fetch('/api/audio-files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchData();
      } else {
        setError(result.error?.message || 'Delete failed');
      }
    } catch (err) {
      setError('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setLoading(true);
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      if (result.success) {
        setError(null);
        alert('Configuration saved successfully!');
      } else {
        setError(result.error?.message || 'Save failed');
      }
    } catch (err) {
      setError('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      sessionStorage.removeItem('admin-password');
      setPassword('');
    } catch (err) {
      console.error('Logout failed:', err);
      // Force logout anyway
      setIsAuthenticated(false);
      sessionStorage.removeItem('admin-password');
      setPassword('');
    }
  };

  const addCategory = () => {
    if (!config) return;
    const newCategory: Category = {
      name: 'New Category',
      sounds: [],
    };
    setConfig({
      ...config,
      categories: [...config.categories, newCategory],
    });
  };

  const updateCategory = (index: number, updatedCategory: Category) => {
    if (!config) return;
    const newCategories = [...config.categories];
    newCategories[index] = updatedCategory;
    setConfig({
      ...config,
      categories: newCategories,
    });
  };

  const deleteCategory = (index: number) => {
    if (!config) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    const newCategories = config.categories.filter((_, i) => i !== index);
    setConfig({
      ...config,
      categories: newCategories,
    });
  };

  const addSound = (categoryIndex: number) => {
    if (!config) return;
    const newSound: Sound = {
      name: 'New Sound',
      file: '',
    };
    const newCategories = [...config.categories];
    newCategories[categoryIndex].sounds.push(newSound);
    setConfig({
      ...config,
      categories: newCategories,
    });
  };

  const updateSound = (categoryIndex: number, soundIndex: number, updatedSound: Sound) => {
    if (!config) return;
    const newCategories = [...config.categories];
    newCategories[categoryIndex].sounds[soundIndex] = updatedSound;
    setConfig({
      ...config,
      categories: newCategories,
    });
  };

  const deleteSound = (categoryIndex: number, soundIndex: number) => {
    if (!config) return;
    const newCategories = [...config.categories];
    newCategories[categoryIndex].sounds.splice(soundIndex, 1);
    setConfig({
      ...config,
      categories: newCategories,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <Home className="w-4 h-4 mr-2" />
              Back to Soundboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        {error && (
          <Card className="mb-4 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="layout" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="layout">
            <Settings className="w-4 h-4 mr-2" />
            Manage Layout
          </TabsTrigger>
          <TabsTrigger value="files">
            <Upload className="w-4 h-4 mr-2" />
            Manage Audio Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                />
                <Button onClick={handleFileUpload} disabled={uploadFiles.length === 0 || loading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? 'Uploading...' : `Upload ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
                </Button>
              </div>
              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected files ({uploadFiles.length}):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadFiles([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
              {uploadProgress && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{uploadProgress}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Supported formats: MP3, WAV, FLAC, OGG, M4A, AAC (Max 2MB each)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audio Files ({audioFiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {audioFiles.length === 0 ? (
                <p className="text-muted-foreground">No audio files uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {audioFiles.map((file) => (
                    <div key={file} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">{file}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleFileDelete(file)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Layout Configuration</h2>
            <div className="space-x-2">
              <Button onClick={addCategory} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <Button onClick={handleSaveConfig} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Layout
              </Button>
            </div>
          </div>

          {config && (
            <Accordion type="single" collapsible className="w-full">
              {config.categories.map((category, categoryIndex) => (
                <AccordionItem key={categoryIndex} value={`category-${categoryIndex}`}>
                  <div className="flex items-center justify-between w-full">
                    <AccordionTrigger className="hover:no-underline flex-1">
                      <span>{category.name} ({category.sounds.length} sounds)</span>
                    </AccordionTrigger>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(categoryIndex);
                      }}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <AccordionContent>
                    <div className="space-y-4 p-4">
                      <div className="flex items-center space-x-4">
                        <Input
                          value={category.name}
                          onChange={(e) =>
                            updateCategory(categoryIndex, {
                              ...category,
                              name: e.target.value,
                            })
                          }
                          placeholder="Category name"
                        />
                        <Button
                          onClick={() => addSound(categoryIndex)}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Sound
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {category.sounds.map((sound, soundIndex) => (
                          <div key={soundIndex} className="flex items-center space-x-4 p-3 border rounded">
                            <Input
                              value={sound.name}
                              onChange={(e) =>
                                updateSound(categoryIndex, soundIndex, {
                                  ...sound,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Sound name"
                              className="flex-1"
                            />
                            <Select
                              value={sound.file}
                              onValueChange={(value) =>
                                updateSound(categoryIndex, soundIndex, {
                                  ...sound,
                                  file: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select audio file" />
                              </SelectTrigger>
                              <SelectContent>
                                {audioFiles.map((file) => (
                                  <SelectItem key={file} value={file}>
                                    {file}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteSound(categoryIndex, soundIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {(!config?.categories || config.categories.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <p>No categories configured yet.</p>
                  <p>Click &quot;Add Category&quot; to get started.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return <AdminContent />;
}
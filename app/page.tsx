'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, StopCircle, Sun, Moon } from 'lucide-react';
import { AudioProvider, useAudio } from './components/audio-player';
import { ThemeProvider, useTheme } from './components/theme-provider';
import { SoundboardConfig } from '@/lib/types';

function SoundboardContent() {
  const [config, setConfig] = useState<SoundboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { volume, setVolume, playSound, stopAll, currentlyPlaying, isMuted, toggleMute } = useAudio();
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
      } else {
        setError(result.error?.message || 'Failed to load configuration');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading soundboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchConfig} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Soundboard</h1>
          <Button variant="outline" size="sm" onClick={toggleDarkMode}>
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleMute}
                  className="p-2"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <div className="flex-1 max-w-xs">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                    disabled={isMuted}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12">
                  {isMuted ? 'Muted' : `${volume}%`}
                </span>
              </div>
              
              <Button
                onClick={stopAll}
                variant="destructive"
                size="sm"
                className="ml-4"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Stop All
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Sound Categories */}
      <div className="grid gap-6">
        {config?.categories?.map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <CardTitle className="text-xl">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {category.sounds.map((sound) => (
                  <Button
                    key={sound.name}
                    onClick={() => playSound(sound.file)}
                    variant={currentlyPlaying === sound.file ? "default" : "outline"}
                    className="h-auto py-4 px-4 text-center"
                  >
                    <span className="break-words">{sound.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!config?.categories || config.categories.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No sounds configured yet.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SoundboardPage() {
  return (
    <AudioProvider>
      <SoundboardContent />
    </AudioProvider>
  );
}
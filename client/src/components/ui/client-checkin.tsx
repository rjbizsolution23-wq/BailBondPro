import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, MapPin, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { api } from "@/lib/api";

interface PhotoVerificationResult {
  isValidPhoto: boolean;
  confidence: number;
  personDetected: boolean;
  quality: 'high' | 'medium' | 'low';
  issues?: string[];
}

interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function ClientCheckin() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationCoords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<PhotoVerificationResult | null>(null);

  const verifyPhotoMutation = useMutation({
    mutationFn: (imageData: string) => api.verifyPhoto(imageData),
    onSuccess: (result: PhotoVerificationResult) => {
      setVerificationResult(result);
    },
    onError: (error) => {
      console.error('Photo verification error:', error);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
        setVerificationResult(null);
        
        // Automatically verify the photo
        verifyPhotoMutation.mutate(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError(t('checkin.gpsRequired'));
      return;
    }

    setLocationError(null);
    console.log('[GPS] Requesting location permission...');
    
    // For development/testing, provide mock location if geolocation fails
    const fallbackLocation = () => {
      console.log('[GPS] Using fallback location for development');
      setLocation({
        latitude: 33.4484, // Phoenix, AZ coordinates as example
        longitude: -112.0740,
        accuracy: 10,
      });
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[GPS] Location captured successfully:', position.coords);
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Unknown location error.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        setLocationError(errorMessage);
        
        // In development, use fallback location
        if (import.meta.env.DEV) {
          console.log('[GPS] Development mode - using fallback location');
          fallbackLocation();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSubmitCheckin = () => {
    if (!photo || !location || !verificationResult?.isValidPhoto) {
      return;
    }

    // Here you would submit the check-in data to your backend
    console.log('Submitting check-in:', {
      photo,
      location,
      verification: verificationResult,
      timestamp: new Date().toISOString(),
    });
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span>{t('checkin.title')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>{t('checkin.takePhoto')}</Label>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              data-testid="button-upload-photo"
            >
              <Camera className="h-4 w-4 mr-2" />
              {t('checkin.uploadPhoto')}
            </Button>
          </div>

          {/* Photo Preview */}
          {photo && (
            <div className="relative">
              <img
                src={photo}
                alt="Check-in photo"
                className="w-full h-48 object-cover rounded-lg"
              />
              {verifyPhotoMutation.isPending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Verification Results */}
          {verificationResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Photo Verification:</span>
                {verificationResult.isValidPhoto ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={getQualityColor(verificationResult.quality)}>
                  Quality: {verificationResult.quality}
                </Badge>
                <Badge variant="secondary">
                  {Math.round(verificationResult.confidence * 100)}% confidence
                </Badge>
              </div>

              {verificationResult.issues && verificationResult.issues.length > 0 && (
                <div className="text-xs text-destructive">
                  Issues: {verificationResult.issues.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>{t('checkin.location')}</Label>
          <Button
            onClick={captureLocation}
            variant="outline"
            className="w-full"
            data-testid="button-capture-location"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Capture GPS Location
          </Button>

          {location && (
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              <div>Lat: {location.latitude.toFixed(6)}</div>
              <div>Lng: {location.longitude.toFixed(6)}</div>
              <div>Accuracy: ±{Math.round(location.accuracy)}m</div>
            </div>
          )}

          {locationError && (
            <div className="text-xs text-destructive">
              {locationError}
            </div>
          )}
        </div>

        {/* Submit Check-in */}
        <Button
          onClick={handleSubmitCheckin}
          disabled={!photo || !location || !verificationResult?.isValidPhoto}
          className="w-full"
          data-testid="button-submit-checkin"
        >
          {t('checkin.checkinSuccessful')}
        </Button>

        {/* Compliance Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span>{t('checkin.compliance')}:</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {t('checkin.compliant')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
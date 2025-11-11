import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CameraFeed, { CameraFeedHandle } from './components/CameraFeed';
import Controls from './components/Controls';
import SplashScreen from './components/SplashScreen';
import RememberPersonDialog from './components/RememberPersonDialog';
import * as geminiService from './services/geminiService';
import * as speechService from './services/speechService';
import * as storageService from './services/storageService';
import StreamingTextToSpeech from './services/streamingTextToSpeech';
import { LANGUAGES } from './constants';
import { languageChangeMessages } from './translations';
import { Feature } from './types';

const App: React.FC = () => {
  const [isAppActive, setIsAppActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [language, setLanguage] = useState('en-US');
  const [speechRate, setSpeechRate] = useState(1.4);
  const [statusMessage, setStatusMessage] = useState('Initializing OptiRead...');
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.None);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isRememberPersonDialogOpen, setIsRememberPersonDialogOpen] = useState(false);
  const cameraRef = useRef<CameraFeedHandle>(null);
  const descriptionHistoryRef = useRef<string[]>([]);

  useEffect(() => {
    const savedRate = storageService.getSpeechRate();
    if (savedRate !== null) {
      setSpeechRate(savedRate);
    }
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    if (!navigator.onLine) {
        if(activeFeature !== Feature.None) {
            setActiveFeature(Feature.None);
            speechService.speak("Connection lost. Functionality is limited.", language, speechRate);
        }
        if(isContinuousMode) {
            setIsContinuousMode(false);
            speechService.speak("Connection lost. Continuous mode disabled.", language, speechRate);
        }
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [isOnline, activeFeature, isContinuousMode, language, speechRate]);

  useEffect(() => {
    if (!isAppActive) return;

    let isCancelled = false;
    let navTimeoutId: number | undefined;
    let speechManager: StreamingTextToSpeech | null = null;

    const runFeature = async () => {
      if (activeFeature === Feature.None) {
        setStatusMessage("Ready");
        return;
      }
      
      const handleError = async (error: any, context: string) => {
          console.error(`${context} error:`, error);
          if (isCancelled) return;
          let errorMessage = isOnline ? "Sorry, I encountered an error. Please try again." : "The operation failed because you are offline.";
          if (context === "Speech recognition") {
              errorMessage = "Sorry, I could not understand. Please try again.";
              if (error === 'no-speech') {
                  errorMessage = "I didn't hear anything. Please try again.";
              }
          }
          await speechService.speak(errorMessage, language, speechRate);
      };

      if (activeFeature === Feature.DescribeScene) {
          setStatusMessage("Analyzing scene...");
          const imageBase64 = cameraRef.current?.captureFrame();
          if (!isCancelled && imageBase64) {
              speechManager = new StreamingTextToSpeech(language, speechRate, () => {
                  if (!isCancelled) setActiveFeature(Feature.None);
              });
              try {
                  await geminiService.describeScene(imageBase64, (chunk) => {
                      speechManager?.addChunk(chunk);
                  });
                  speechManager?.flush();
              } catch (error) {
                  await handleError(error, 'Gemini API');
                  if (!isCancelled) setActiveFeature(Feature.None);
              }
          } else if (!isCancelled) {
              await speechService.speak("Could not capture an image from the camera.", language, speechRate);
              if (!isCancelled) setActiveFeature(Feature.None);
          }
          return;
      }
      
      if (activeFeature === Feature.Person) {
          setStatusMessage("Analyzing person...");
          const imageBase64 = cameraRef.current?.captureFrame();
          if (!isCancelled && imageBase64) {
              speechManager = new StreamingTextToSpeech(language, speechRate, () => {
                  if (!isCancelled) setActiveFeature(Feature.None);
              });
              try {
                  const rememberedPeople = await storageService.getAllPeople();
                  if (isCancelled) return;
                  await geminiService.recognizeAndDescribePerson(imageBase64, rememberedPeople, (chunk) => {
                      speechManager?.addChunk(chunk);
                  });
                  speechManager?.flush();
              } catch (error) {
                  await handleError(error, 'Gemini API');
                  if (!isCancelled) setActiveFeature(Feature.None);
              }
          } else if (!isCancelled) {
              await speechService.speak("Could not capture an image from the camera.", language, speechRate);
              if (!isCancelled) setActiveFeature(Feature.None);
          }
          return;
      }

      if (activeFeature === Feature.Ask) {
        try {
          if (isCancelled) return;
          
          const question = await speechService.startRecognition(language);
          if (isCancelled) return;

          setStatusMessage(`Question received: "${question}". Analyzing...`);
          const imageBase64 = cameraRef.current?.captureFrame();
          if (isCancelled) return;

          if (imageBase64) {
            speechManager = new StreamingTextToSpeech(language, speechRate, () => {
                if (!isCancelled) setActiveFeature(Feature.None);
            });
            await geminiService.askAboutImage(imageBase64, question, (chunk) => {
                speechManager?.addChunk(chunk);
            });
            speechManager?.flush();
          } else {
            await speechService.speak("Could not capture an image from the camera.", language, speechRate);
            if (!isCancelled) setActiveFeature(Feature.None);
          }
        } catch (error) {
          handleError(error, "Speech recognition");
          if (!isCancelled) {
            setActiveFeature(Feature.None);
          }
        }
        return;
      }

      if (activeFeature === Feature.Navigation) {
        setStatusMessage("Navigation mode active.");
        await speechService.speak("Starting navigation. Be careful.", language, speechRate);
        if (isCancelled) return;
        
        const navigationLoop = async () => {
          if (isCancelled || !isOnline) {
             if (!isOnline) {
                await speechService.speak("Navigation stopped due to lost connection.", language, speechRate);
                setActiveFeature(Feature.None);
             }
             return;
          }
          const imageBase64 = cameraRef.current?.captureFrame();

          if (imageBase64) {
            try {
              const guidance = await geminiService.getNavigationGuidance(imageBase64);
              if (isCancelled) return;
              await speechService.speak(guidance, language, speechRate);
            } catch (error) {
              console.error("Navigation error:", error);
              if (!isOnline) {
                 await speechService.speak("Navigation stopped due to lost connection.", language, speechRate);
                 setActiveFeature(Feature.None);
                 return;
              }
            }
          }
          if (!isCancelled) {
            navTimeoutId = setTimeout(navigationLoop, 2000);
          }
        };
        navigationLoop();
      }
    };

    runFeature();

    return () => {
      isCancelled = true;
      clearTimeout(navTimeoutId);
      speechManager?.cancel();
      speechService.cancelSpeech();
    };
  }, [activeFeature, language, isAppActive, isOnline, speechRate]);

  useEffect(() => {
    if (!isAppActive || !isContinuousMode) {
      descriptionHistoryRef.current = []; // Clear history when mode is off
      return;
    }

    let isCancelled = false;
    let loopTimeoutId: number | undefined;

    speechService.cancelSpeech(); // Cancel any lingering speech

    const continuousLoop = async () => {
        if (isCancelled || !isOnline) {
            return;
        }

        const imageBase64 = cameraRef.current?.captureFrame();

        if (imageBase64) {
            try {
                const description = await geminiService.getContinuousDescription(imageBase64, descriptionHistoryRef.current);
                if (isCancelled) return;
                
                const trimmedDescription = description.trim();
                if (trimmedDescription && trimmedDescription !== '[SILENT]') {
                     await speechService.speak(trimmedDescription, language, speechRate);
                     // Update the ref with the new description, keeping it short
                     descriptionHistoryRef.current = [trimmedDescription, ...descriptionHistoryRef.current].slice(0, 3);
                }
            } catch (error) {
                console.error("Continuous mode error:", error);
            }
        }
        
        if (!isCancelled) {
            loopTimeoutId = setTimeout(continuousLoop, 4000); // Loop every 4 seconds
        }
    };

    continuousLoop();

    return () => {
        isCancelled = true;
        clearTimeout(loopTimeoutId);
        speechService.cancelSpeech();
    };
  }, [isContinuousMode, language, isAppActive, isOnline, speechRate]);


  const handleCameraReady = () => {
    const readyMessage = "OptiRead is ready. Use the buttons below.";
    setStatusMessage(readyMessage);
    speechService.speak(readyMessage, language, speechRate);
  };

  const handleCameraError = (error: string) => {
    setStatusMessage(error);
    speechService.speak(error, language, speechRate);
  };

  const handleFeatureClick = (feature: Feature) => {
    if (isContinuousMode) {
      speechService.speak("Please switch to manual mode to use this feature.", language, speechRate);
      return;
    }
    
    if (!isOnline && feature !== Feature.None) {
      speechService.speak("This feature requires an internet connection. You are currently offline.", language, speechRate);
      return;
    }

    if (feature === Feature.RememberPerson) {
        if (activeFeature !== Feature.None) {
            setActiveFeature(Feature.None);
        }
        setIsRememberPersonDialogOpen(true);
        return;
    }

    if (activeFeature === feature) {
      if (feature === Feature.Ask) return;
      if (feature === Feature.Navigation) {
        speechService.speak("Navigation stopped.", language, speechRate);
      }
      setActiveFeature(Feature.None);
    } else {
      setActiveFeature(feature);
    }
  };

  const handleModeChange = (isContinuous: boolean) => {
    if (isContinuous) {
      if (activeFeature !== Feature.None) {
        setActiveFeature(Feature.None);
      }
      speechService.speak("Continuous mode activated.", language, speechRate);
      setStatusMessage("Continuous mode active");
    } else {
      speechService.speak("Manual mode activated.", language, speechRate);
      setStatusMessage("Ready");
    }
    setIsContinuousMode(isContinuous);
  };

  const handleLanguageChange = async (langCode: string) => {
    const isSupported = await speechService.isVoiceAvailableForLang(langCode);
    const oldLanguage = language;
    
    setLanguage(langCode);

    if (isSupported) {
        const message = languageChangeMessages[langCode] || `Language set to ${LANGUAGES.find(l => l.code === langCode)?.name}`;
        speechService.speak(message, langCode, speechRate);
    } else {
        const langName = LANGUAGES.find(l => l.code === langCode)?.name || 'the selected language';
        const errorMessage = `Sorry, a voice for ${langName} is not available on this device. Reverting to the previous language.`;
        await speechService.speak(errorMessage, oldLanguage, speechRate);
        setLanguage(oldLanguage);
    }
  };

  const handleSpeechRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    storageService.saveSpeechRate(newRate);
  };
  
  const handleStartApp = () => {
    setIsAppActive(true);
  };
  
  const handleCloseRememberDialog = () => {
      setIsRememberPersonDialogOpen(false);
      setActiveFeature(Feature.None);
  };

  const handleSavePerson = async (name: string) => {
      if (!name.trim()) {
          speechService.speak("Please provide a name.", language, speechRate);
          return;
      }
      setIsRememberPersonDialogOpen(false);
      setStatusMessage(`Remembering ${name}...`);
      
      const imageBase64 = cameraRef.current?.captureFrame();
      if (imageBase64) {
          try {
              await storageService.addPerson({ name, imageBase64 });
              await speechService.speak(`Okay, I've remembered ${name}.`, language, speechRate);
          } catch (error) {
              console.error("Error saving person:", error);
              await speechService.speak(`Sorry, there was an error saving ${name}.`, language, speechRate);
          }
      } else {
          await speechService.speak("Could not capture an image to remember.", language, speechRate);
      }
      setStatusMessage("Ready");
      setActiveFeature(Feature.None);
  };

  const handleSpeakNameForRemember = async () => {
      try {
          setActiveFeature(Feature.RememberPerson);
          setStatusMessage("Listening for name...");
          await speechService.speak("Please say the person's name.", language, speechRate);

          const name = await speechService.startRecognition(language);
          await handleSavePerson(name);
      } catch (error) {
          console.error("Speech recognition error:", error);
          let errorMessage = "Sorry, I could not understand. Please try again.";
          if (error === 'no-speech') {
              errorMessage = "I didn't hear anything. Please try again.";
          }
          await speechService.speak(errorMessage, language, speechRate);
          setActiveFeature(Feature.None);
      }
  };

  if (!isAppActive) {
    return <SplashScreen onStart={handleStartApp} />;
  }

  return (
    <div className="bg-black text-white h-screen w-screen flex flex-col relative overflow-hidden">
      <Header
        isOnline={isOnline}
        selectedLanguage={language}
        onLanguageChange={handleLanguageChange}
        languages={LANGUAGES}
        isContinuousMode={isContinuousMode}
        onModeChange={handleModeChange}
        speechRate={speechRate}
        onSpeechRateChange={handleSpeechRateChange}
      />
      <main className="flex-grow relative">
        <div className="absolute inset-0">
          <CameraFeed ref={cameraRef} onStreamReady={handleCameraReady} onStreamError={handleCameraError} />
        </div>
        {isRememberPersonDialogOpen && (
          <RememberPersonDialog
            onClose={handleCloseRememberDialog}
            onSave={handleSavePerson}
            onSpeakName={handleSpeakNameForRemember}
            isListening={activeFeature === Feature.RememberPerson}
          />
        )}
      </main>
      <Controls
        onDescribeSceneClick={() => handleFeatureClick(Feature.DescribeScene)}
        onDescribePersonClick={() => handleFeatureClick(Feature.Person)}
        onRememberPersonClick={() => handleFeatureClick(Feature.RememberPerson)}
        onAskClick={() => handleFeatureClick(Feature.Ask)}
        onNavigationClick={() => handleFeatureClick(Feature.Navigation)}
        activeFeature={activeFeature}
        isDisabled={isContinuousMode}
      />
    </div>
  );
};

export default App;
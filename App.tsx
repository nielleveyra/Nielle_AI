
import React, { useState, useCallback, ChangeEvent, useMemo, useEffect } from 'react';
import { analyzeScene, generateImageWithNanoBanana } from './services/geminiService';
import { LookType, StyleChoices, SceneAnalysisResult } from './types';
import { STYLE_OPTIONS, CLOTHING_OPTIONS, HIJAB_STYLE_OPTIONS, HAIR_STYLE_OPTIONS } from './constants';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

// --- SVG Icons ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);


// --- Helper Components ---
const Header: React.FC = () => (
  <header className="text-center py-8 px-4">
    <div className="h-16 flex justify-center items-center mb-2">
      <h1 className="text-4xl font-bold text-pastel-accent-dark dark:text-dark-accent tracking-wider">NIELLE AI STYLE REFINER</h1>
    </div>
    <p className="text-md text-pastel-text dark:text-dark-text mt-2">Craft your perfect ultra-realistic prompt in just a few steps.</p>
  </header>
);


interface StepCardProps {
  step: number;
  title: string;
  children: React.ReactNode;
  isDisabled?: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, children, isDisabled = false }) => (
  <div className={`bg-pastel-card dark:bg-dark-card rounded-2xl shadow-lg p-6 md:p-8 mb-8 transition-opacity duration-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
    <h2 className="text-2xl font-bold text-pastel-accent-dark dark:text-dark-accent mb-4">
      <span className="bg-lilac dark:bg-dark-border/50 text-pastel-accent-dark dark:text-dark-accent rounded-full h-8 w-8 inline-flex items-center justify-center mr-3 font-mono">{step}</span>
      {title}
    </h2>
    <div className={isDisabled ? 'pointer-events-none' : ''}>
        {children}
    </div>
  </div>
);

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  previewUrl: string | null;
  id: string;
  title: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, previewUrl, id, title }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-pastel-accent dark:border-dark-border rounded-lg p-6 hover:bg-lilac dark:hover:bg-dark-border transition-colors">
        <UploadIcon />
        <span className="text-pastel-text dark:text-dark-text">{title}</span>
      </label>
      <input id={id} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
      {previewUrl && (
        <div className="mt-4">
          <img src={previewUrl} alt="Preview" className="max-w-xs mx-auto rounded-lg shadow-md" />
        </div>
      )}
    </div>
  );
};


interface StyleSelectorProps {
    onStyleChange: (choices: Partial<StyleChoices>) => void;
    initialChoices: StyleChoices;
    detectedAccessories: string[];
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ onStyleChange, initialChoices, detectedAccessories }) => {
    const { lookType } = initialChoices;

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onStyleChange({ [e.target.name]: e.target.value });
    };

    const handleLookTypeChange = (type: LookType) => {
        const defaultStyle = STYLE_OPTIONS[type][0];
        const defaultClothing = CLOTHING_OPTIONS[type][0];
        const defaultHijab = HIJAB_STYLE_OPTIONS[0];
        const defaultHair = HAIR_STYLE_OPTIONS[0];
        
        onStyleChange({
            lookType: type,
            style: defaultStyle,
            clothing: defaultClothing,
            hijabStyle: type === LookType.HIJAB ? defaultHijab : '',
            hairStyle: type === LookType.NON_HIJAB ? defaultHair : '',
        });
    }

    return (
        <div>
            <div className="flex justify-center gap-4 mb-6">
                <button 
                    onClick={() => handleLookTypeChange(LookType.HIJAB)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all ${lookType === LookType.HIJAB ? 'bg-pastel-accent-dark dark:bg-dark-accent text-white dark:text-dark-bg shadow-md' : 'bg-lilac dark:bg-dark-border text-pastel-text dark:text-dark-text hover:bg-pastel-accent dark:hover:bg-dark-accent'}`}
                >
                    Hijab Look
                </button>
                <button 
                    onClick={() => handleLookTypeChange(LookType.NON_HIJAB)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all ${lookType === LookType.NON_HIJAB ? 'bg-pastel-accent-dark dark:bg-dark-accent text-white dark:text-dark-bg shadow-md' : 'bg-lilac dark:bg-dark-border text-pastel-text dark:text-dark-text hover:bg-pastel-accent dark:hover:bg-dark-accent'}`}
                >
                    Non-Hijab Look
                </button>
            </div>

            {lookType && (
                <div className="space-y-4 animate-fade-in">
                    <SelectInput label="Outfit Style" name="style" value={initialChoices.style} options={STYLE_OPTIONS[lookType]} onChange={handleSelectChange} />
                    {lookType === LookType.HIJAB && (
                        <SelectInput label="Hijab Style" name="hijabStyle" value={initialChoices.hijabStyle} options={HIJAB_STYLE_OPTIONS} onChange={handleSelectChange} />
                    )}
                    {lookType === LookType.NON_HIJAB && (
                         <SelectInput label="Hair Style" name="hairStyle" value={initialChoices.hairStyle} options={HAIR_STYLE_OPTIONS} onChange={handleSelectChange} />
                    )}
                    <SelectInput label="Clothing" name="clothing" value={initialChoices.clothing} options={CLOTHING_OPTIONS[lookType]} onChange={handleSelectChange} />
                    {detectedAccessories.length > 0 && <p className="text-sm text-pastel-text dark:text-dark-text/80 pt-2">Detected accessories ({detectedAccessories.join(', ')}) will be restyled automatically.</p>}
                </div>
            )}
        </div>
    );
};

interface SelectInputProps {
    label: string;
    name: string;
    value: string;
    options: string[];
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const SelectInput: React.FC<SelectInputProps> = ({ label, name, value, options, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-pastel-text dark:text-dark-text mb-1">{label}</label>
        <select name={name} value={value} onChange={onChange} className="w-full p-2 border border-lilac dark:border-dark-border rounded-md focus:ring-pastel-accent dark:focus:ring-dark-accent focus:border-pastel-accent dark:focus:border-dark-accent bg-white dark:bg-dark-card text-pastel-text dark:text-dark-text">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

interface DoodleToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

const DoodleToggle: React.FC<DoodleToggleProps> = ({ enabled, onToggle }) => (
    <div className="flex items-center justify-between bg-lilac dark:bg-dark-border p-4 rounded-lg">
        <span className="font-medium text-pastel-text dark:text-dark-text">Add aesthetic doodles & recolor props?</span>
        <button
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-pastel-accent-dark dark:bg-dark-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

interface NanoGeminiToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

const NanoGeminiToggle: React.FC<NanoGeminiToggleProps> = ({ enabled, onToggle }) => (
    <div className="flex items-center justify-between bg-lilac dark:bg-dark-border p-4 rounded-lg mt-4">
        <div>
            <span className="font-medium text-pastel-text dark:text-dark-text">Enable Advanced Face Preservation?</span>
            <p className="text-xs text-pastel-text/70 dark:text-dark-text/70">Uses Nano Gemini for ultra-precise face locking.</p>
        </div>
        <button
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-pastel-accent-dark dark:bg-dark-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

interface ThresholdSliderProps {
    value: number;
    onChange: (value: number) => void;
}

const ThresholdSlider: React.FC<ThresholdSliderProps> = ({ value, onChange }) => (
    <div className="bg-lilac/50 dark:bg-dark-border/50 p-4 rounded-lg mt-4 animate-fade-in border border-pastel-accent/50 dark:border-dark-accent/50">
        <label htmlFor="threshold-slider" className="block text-sm font-medium text-pastel-text dark:text-dark-text mb-2">
            Face Match Strictness: <span className="font-bold text-pastel-accent-dark dark:text-dark-accent">{value.toFixed(2)}</span>
        </label>
        <input
            id="threshold-slider"
            type="range"
            min="0.90"
            max="0.99"
            step="0.01"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-lilac dark:bg-dark-border/70 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        {/* Custom styling for the slider thumb */}
        <style>{`
            .slider-thumb::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 1rem;
                height: 1rem;
                background-color: #c8a2c8; /* pastel-accent-dark */
                border-radius: 9999px;
                cursor: pointer;
                margin-top: -4px; /* Center thumb on track */
            }
            .dark .slider-thumb::-webkit-slider-thumb {
                background-color: #a78bfa; /* dark-accent */
            }
            .slider-thumb::-moz-range-thumb {
                width: 1rem;
                height: 1rem;
                background-color: #c8a2c8; /* pastel-accent-dark */
                border-radius: 9999px;
                cursor: pointer;
                border: none;
            }
            .dark .slider-thumb::-moz-range-thumb {
                background-color: #a78bfa; /* dark-accent */
            }
        `}</style>
        <p className="text-xs text-pastel-text/70 dark:text-dark-text/70 mt-1">Higher values enforce stricter face matching. 0.98 is recommended for strong preservation.</p>
    </div>
);


interface PromptDisplayProps {
    prompt: string;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <div className="relative">
                <textarea
                    readOnly
                    value={prompt}
                    className="w-full h-64 p-4 font-mono text-sm bg-pastel-bg dark:bg-dark-bg border border-lilac dark:border-dark-border rounded-lg resize-none text-pastel-text dark:text-dark-text"
                    placeholder="Your final prompt will appear here once all steps are completed and you click 'Generate'..."
                />
                {prompt && (
                    <button onClick={handleCopy} className="absolute top-3 right-3 bg-pastel-accent dark:bg-dark-accent text-white dark:text-dark-bg px-3 py-1 rounded-md hover:bg-pastel-accent-dark dark:hover:bg-dark-accent-dark transition-all flex items-center">
                       {copied ? <CheckIcon /> : <CopyIcon />}
                       <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-4 text-pastel-text dark:text-dark-text">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-accent-dark dark:border-dark-accent"></div>
    <p className="mt-4">{message}</p>
  </div>
);

interface PromptPreviewProps {
    styleChoices: StyleChoices;
    sceneAnalysis: SceneAnalysisResult | null;
    addDoodles: boolean;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({ styleChoices, sceneAnalysis, addDoodles }) => {
    const promptParts = useMemo(() => {
        if (!styleChoices.lookType) return null;

        const parts: { label: string; value: string }[] = [];
        const detectedAccessories = sceneAnalysis?.accessories || [];

        if (styleChoices.style) parts.push({ label: 'Style', value: styleChoices.style });
        if (styleChoices.clothing) parts.push({ label: 'Clothing', value: styleChoices.clothing });
        if (styleChoices.lookType === LookType.HIJAB && styleChoices.hijabStyle) {
            parts.push({ label: 'Hijab', value: styleChoices.hijabStyle });
        } else if (styleChoices.lookType === LookType.NON_HIJAB && styleChoices.hairStyle) {
            parts.push({ label: 'Hair', value: styleChoices.hairStyle });
        }
        if (detectedAccessories.length > 0) {
            parts.push({ label: 'Accessories', value: `Detected ${detectedAccessories.join(', ')} will be restyled.` });
        }
        if (addDoodles) {
            parts.push({ label: 'Aesthetics', value: 'Doodles & recolored props will be added.' });
        }
        return parts;
    }, [styleChoices, sceneAnalysis, addDoodles]);

    if (!promptParts || promptParts.length === 0) {
        return null;
    }

    return (
        <div className="bg-lilac/50 dark:bg-dark-border/50 p-4 rounded-lg mb-6 border border-pastel-accent dark:border-dark-accent animate-fade-in">
            <h4 className="font-semibold text-pastel-text dark:text-dark-text mb-2 text-center text-md">Live Prompt Preview</h4>
            <ul className="space-y-1 text-sm text-pastel-text/90 dark:text-dark-text/90">
                {promptParts.map(part => (
                    <li key={part.label} className="flex items-start">
                        <span className="font-semibold w-24 flex-shrink-0">{part.label}:</span>
                        <span>{part.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [sceneImagePreview, setSceneImagePreview] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  
  const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [styleChoices, setStyleChoices] = useState<StyleChoices>({
    lookType: null,
    style: '',
    clothing: '',
    hijabStyle: '',
    hairStyle: '',
  });

  const [addDoodles, setAddDoodles] = useState(false);
  const [useNanoGemini, setUseNanoGemini] = useState(false);
  const [faceMatchThreshold, setFaceMatchThreshold] = useState(0.98);
  const [finalPrompt, setFinalPrompt] = useState('');

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme) return storedTheme;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const isApiKeyMissing = !process.env.API_KEY;

  const handleSceneUpload = useCallback(async (file: File) => {
    setFinalPrompt('');
    setGeneratedImage(null);
    setGenerationError(null);
    setSceneImage(file);
    setSceneImagePreview(URL.createObjectURL(file));
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setSceneAnalysis(null);

    try {
      const base64Image = await fileToBase64(file);
      const result = await analyzeScene(base64Image, file.type);
      setSceneAnalysis(result);
    } catch (error) {
      console.error("Error analyzing scene:", error);
      setAnalysisError("Sorry, we couldn't analyze the photo. Please try another one.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, []);

  const handleFaceUpload = useCallback((file: File) => {
    setFinalPrompt('');
    setGeneratedImage(null);
    setGenerationError(null);
    setFaceImage(file);
    setFaceImagePreview(URL.createObjectURL(file));
  }, []);

  const handleStyleChange = useCallback((choices: Partial<StyleChoices>) => {
    setFinalPrompt('');
    setGeneratedImage(null);
    setGenerationError(null);
    setStyleChoices(prev => ({ ...prev, ...choices }));
  }, []);

  const handleDoodleToggle = useCallback((enabled: boolean) => {
    setFinalPrompt('');
    setGeneratedImage(null);
    setGenerationError(null);
    setAddDoodles(enabled);
  }, []);
  
  const handleNanoGeminiToggle = useCallback((enabled: boolean) => {
    setFinalPrompt('');
    setGeneratedImage(null);
    setGenerationError(null);
    setUseNanoGemini(enabled);
  }, []);

  const handleThresholdChange = useCallback((value: number) => {
    setFinalPrompt('');
    setGeneratedImage(null);
    setGenerationError(null);
    setFaceMatchThreshold(value);
  }, []);

  const isStepsUnlocked = useMemo(() => sceneAnalysis !== null, [sceneAnalysis]);
  const isPromptReady = useMemo(() => isStepsUnlocked && styleChoices.lookType !== null, [isStepsUnlocked, styleChoices.lookType]);

  const handleGeneratePrompt = () => {
    if (!isPromptReady || !sceneAnalysis) {
        return;
    }

    // BLOCK 1: FACE
    const block1 = `FACE & IDENTITY: The subject's face MUST be identical to the face in the provided 'My Pict' photo. Use this photo ONLY for the face reference. Its background, clothing, and all other elements MUST be completely ignored.`;

    // BLOCK 2: SCENE
    const block2 = `SCENE & POSE: The background, posture, setting, environment, and overall lighting/shadows MUST REMAIN EXACTLY like the original 'Scene Photo Reference'. Do not use any background elements from the 'My Pict' photo. Maintain the original photo's perspective and camera angle. ${sceneAnalysis.description}`;
    
    // BLOCK 3: STYLE
    let styleDetails = '';
    const accessories = sceneAnalysis.accessories || [];
    const hasBag = accessories.some(acc => acc.toLowerCase().includes('bag'));
    const hasHat = accessories.some(acc => acc.toLowerCase().includes('hat') || acc.toLowerCase().includes('cap'));
    const otherAccessories = accessories.filter(acc => !acc.toLowerCase().includes('bag') && !acc.toLowerCase().includes('hat') && !acc.toLowerCase().includes('cap'));
    
    const otherAccessoriesText = otherAccessories.length > 0 ? `(e.g., ${otherAccessories.join(', ')})` : '';

    if (styleChoices.lookType === LookType.HIJAB) {
        styleDetails = `Instead of the current outfit, change it into a soft pastel ${styleChoices.style} hijab-friendly look. The hijab is styled in a ${styleChoices.hijabStyle}. Replace the original clothing with a ${styleChoices.clothing}.`;
        let accessoryPrompt = `Keep all existing accessories ${otherAccessoriesText} but recolor them to muted pastel/gold tones.`;
        if (hasBag) accessoryPrompt += ' Replace the original bag with a soft pastel yellow tote bag.';
        if (hasHat) accessoryPrompt += ' Replace the original cap/hat with a pastel sage-green cap worn on top of the hijab.';
        styleDetails += ` ${accessoryPrompt.trim()}`;
    } else if (styleChoices.lookType === LookType.NON_HIJAB) {
        styleDetails = `Instead of the current outfit, change it into a ${styleChoices.style} look. The hair is styled in a ${styleChoices.hairStyle}. Replace the original clothing with a ${styleChoices.clothing}.`;
        let accessoryPrompt = `Keep all existing accessories ${otherAccessoriesText}, recoloring them to a soft, glossy finish.`;
        if (hasBag) accessoryPrompt += ' Replace the original bag with a clean minimalist pastel blue clutch.';
        if (hasHat) accessoryPrompt += ' Replace the original hat with a stylish pastel felt fedora.';
        styleDetails += ` ${accessoryPrompt.trim()}`;
    }
    const block3 = styleDetails;

    // BLOCK 4: DOODLES & REALISM
    let block4 = '';
    if (addDoodles) {
        block4 += `Incorporate small white aesthetic doodles around the person and objects (such as handwritten text, delicate stars, subtle curved lines following the head movement, and playful squiggles), blending naturally and subtly with the photo's realism. All props in the scene must be recolored into muted pastel tones while still looking realistic. `;
    }
    block4 += `Ensure an ultra-photorealistic, high-resolution 8K output. The final image should look like a professional, high-end editorial photograph with a soft pastel aesthetic. The overall mood should be dreamy yet authentic.`;

    // BLOCK 5: NANO GEMINI (OPTIONAL)
    let block5 = '';
    if (useNanoGemini) {
        block5 = `--- NANO-GEMINI-CONFIG ---\n` +
                 `face_preservation: {\n` +
                 `  enabled: true,\n` +
                 `  mode: "lock",\n` +
                 `  face_match_threshold: ${faceMatchThreshold.toFixed(2)},\n` +
                 `  ignore_reference_background: true,\n` +
                 `  bind_face_to_subject_pose: true\n` +
                 `}\n` +
                 `postprocess: {\n` +
                 `  lighting_alignment: true,\n` +
                 `  neck_blend: true\n` +
                 `}`;
    }

    const fullPrompt = [block1, block2, block3, block4, block5].filter(Boolean).join('\n\n');
    setFinalPrompt(fullPrompt);
  };

  const handleGenerateImage = useCallback(async () => {
    if (!finalPrompt || !sceneImage || !faceImage) {
        setGenerationError("Please ensure a prompt is generated and both scene and face photos are uploaded.");
        return;
    }

    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setGenerationError(null);

    try {
        const sceneImageBase64 = await fileToBase64(sceneImage);
        const faceImageBase64 = await fileToBase64(faceImage);
        
        const imageData = await generateImageWithNanoBanana(
            finalPrompt,
            sceneImageBase64,
            sceneImage.type,
            faceImageBase64,
            faceImage.type
        );
        
        setGeneratedImage(`data:image/png;base64,${imageData}`);

    } catch (error) {
        console.error("Error generating image with Nano Banana:", error);
        setGenerationError("Sorry, we couldn't generate the image. Please try again.");
    } finally {
        setIsGeneratingImage(false);
    }

  }, [finalPrompt, sceneImage, faceImage]);

  if (isApiKeyMissing) {
    return (
      <div className="min-h-screen bg-pastel-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4 text-pastel-text dark:text-dark-text">
        <div className="bg-pastel-card dark:bg-dark-card rounded-2xl shadow-lg p-8 max-w-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-pastel-accent-dark dark:text-dark-accent mb-2">API Key Required</h2>
          <p className="text-pastel-text dark:text-dark-text">
            To use the NIELLE AI STYLE REFINER, you need to provide a Gemini API key. Please make sure it's set up correctly in your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-pastel-text dark:text-dark-text font-sans relative">
      <button 
        onClick={toggleTheme} 
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-pastel-card dark:bg-dark-card shadow-lg text-pastel-accent-dark dark:text-dark-accent hover:scale-110 transition-transform"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>

      <Header />
      
      <main className="max-w-3xl mx-auto p-4">
        
        <StepCard step={1} title="Upload Scene Photo Reference">
          <FileUpload onFileUpload={handleSceneUpload} previewUrl={sceneImagePreview} id="scene-upload" title="Click to upload Scene photo" />
          {isLoadingAnalysis && <Loader message="Analyzing scene, posture, and accessories..." />}
          {analysisError && <p className="text-red-500 dark:text-red-400 text-center mt-4">{analysisError}</p>}
        </StepCard>

        <StepCard step={2} title="Choose Your Style Overhaul" isDisabled={!isStepsUnlocked}>
            <StyleSelector onStyleChange={handleStyleChange} initialChoices={styleChoices} detectedAccessories={sceneAnalysis?.accessories || []} />
        </StepCard>

        <StepCard step={3} title="Add Aesthetic Doodles (Optional)" isDisabled={!isStepsUnlocked}>
            <DoodleToggle enabled={addDoodles} onToggle={handleDoodleToggle} />
        </StepCard>

        <StepCard step={4} title="Your Final Prompt (Copy & Use)" isDisabled={!isStepsUnlocked}>
            <PromptPreview 
                styleChoices={styleChoices}
                sceneAnalysis={sceneAnalysis}
                addDoodles={addDoodles}
            />
            <div className="mb-6">
                 <button 
                    onClick={handleGeneratePrompt}
                    disabled={!isPromptReady}
                    className="w-full px-6 py-3 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-pastel-accent-dark dark:bg-dark-accent text-white dark:text-dark-bg shadow-lg hover:bg-pastel-accent-dark/90 dark:hover:bg-dark-accent-dark/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 transform hover:scale-105"
                 >
                    ✨ Generate Final Prompt ✨
                 </button>
            </div>
            <PromptDisplay prompt={finalPrompt} />
        </StepCard>

        <StepCard step={5} title="Upload My Pict (Face Preservation)" isDisabled={!isStepsUnlocked}>
           <FileUpload onFileUpload={handleFaceUpload} previewUrl={faceImagePreview} id="face-upload" title="Click to upload Face photo" />
           <p className="text-xs text-center text-pastel-text/80 dark:text-dark-text/80 mt-4 px-2">
               For best face preservation, use a clear, high-resolution (1024px+) and well-lit photo. A frontal or slightly angled view works best. The model will only use the face, so the background of this photo is completely ignored.
           </p>
           <NanoGeminiToggle enabled={useNanoGemini} onToggle={handleNanoGeminiToggle} />
           {useNanoGemini && (
               <ThresholdSlider value={faceMatchThreshold} onChange={handleThresholdChange} />
           )}
        </StepCard>

        <StepCard step={6} title="Generate Your Final Image" isDisabled={!finalPrompt || !faceImage}>
            <div className="text-center space-y-4">
                <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="w-full px-6 py-4 rounded-lg font-semibold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-soft-pink text-pastel-accent-dark dark:bg-dark-accent dark:text-dark-bg shadow-lg hover:bg-pastel-accent hover:text-white dark:hover:bg-dark-accent-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 transform hover:scale-105"
                >
                    {isGeneratingImage ? 'Generating...' : '🍌 Generate with Nano Banana 🍌'}
                </button>
                
                {isGeneratingImage && <Loader message="Creating your new look... This may take a moment." />}
                {generationError && <p className="text-red-500 dark:text-red-400 text-center mt-4">{generationError}</p>}
                
                {generatedImage && (
                    <div className="mt-4 flex flex-col items-center animate-fade-in">
                        <img src={generatedImage} alt="Generated with NIELLE AI" className="max-w-full mx-auto rounded-lg shadow-md" />
                         <a 
                            href={generatedImage} 
                            download="nielle-ai-generated-image.png"
                            className="mt-4 px-6 py-2 bg-lilac dark:bg-dark-border text-pastel-text dark:text-dark-text rounded-full font-semibold transition-all hover:bg-pastel-accent dark:hover:bg-dark-accent"
                        >
                            Download Image
                        </a>
                    </div>
                )}
            </div>
        </StepCard>

      </main>
      <footer className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
        <p>Powered by NIELLE AI</p>
      </footer>
    </div>
  );
}

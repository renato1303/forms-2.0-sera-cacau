import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ArrowLeft, Send, Sparkles, Check, ChevronRight, ChevronDown,
  HelpCircle, Eye, ShieldCheck, Settings, Globe, PhoneCall, AlertTriangle, Play,
  Calendar, Video, Lock, User, Building2, FileText, Phone, Mail, MapPin, Instagram, Loader2
} from 'lucide-react';
import { 
  QUESTIONS_LIST, INITIAL_LEAD_DATA, maskPhone, validateEmail, 
  validatePhone, buildWhatsAppMessage, buildFormattedMessageText, DEFAULT_INTEGRATIONS_CONFIG, calculateLeadScore, getDDDInfo, getResolvedIntegrationsConfig,
  maskCNPJ, maskCEP, BRAZILIAN_STATES 
} from './data';
import { LeadData, Question, IntegrationConfig, BookedMeeting } from './types';
import { createClient } from '@supabase/supabase-js';
import LoaderStep from './components/LoaderStep';
import LeadSummary from './components/LeadSummary';
import AdminPanel from './components/AdminPanel';
import BookingCalendar from './components/BookingCalendar';
import ThankYouPage from './components/ThankYouPage';

export default function App() {
  const [lead, setLead] = useState<LeadData>(INITIAL_LEAD_DATA);
  const leadRef = useRef<LeadData>(INITIAL_LEAD_DATA);
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('step') === '1' || params.get('direct') === 'true') {
        return 1;
      }
    }
    return 0; // Starts at welcome screen (matching user reference mockup)
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [checkboxValue, setCheckboxValue] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [computedRedirectUrl, setComputedRedirectUrl] = useState<string>("https://contato.seracacau.com.br/");

  // Final Data Capture Form State (matching the user's attached design)
  const [finalForm, setFinalForm] = useState({
    nome: '',
    empresa: '',
    cnpj: '',
    whatsapp: '',
    email: '',
    cep: '',
    cidade: '',
    uf: '',
    instagram: '',
  });
  const [finalFormError, setFinalFormError] = useState<string | null>(null);
  const [finalFormConsent, setFinalFormConsent] = useState<boolean>(true);
  const [isCepLoading, setIsCepLoading] = useState<boolean>(false);
  
  // Booking/Scheduling States
  const [bookedMeeting, setBookedMeeting] = useState<BookedMeeting | null>(null);
  const [showBookingStep, setShowBookingStep] = useState<boolean>(true);

  // Admin and Password-protection State fields
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sensesales_admin_logged_in') === 'true';
  });
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const [deviceInfo, setDeviceInfo] = useState({ os: 'Unknown', browser: 'Unknown' });

  // Input ref to auto focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse UTM params and device info on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get('utm_source') || params.get('src') || '';
    const utm_campaign = params.get('utm_campaign') || '';
    const utm_medium = params.get('utm_medium') || '';
    const utm_content = params.get('utm_content') || '';
    const utm_term = params.get('utm_term') || '';
    const campaign_id = params.get('campaign_id') || '';
    const adset_id = params.get('adset_id') || '';
    const ad_id = params.get('ad_id') || '';

    // Cache in sessionStorage to prevent parameter loss during multi-step form completion
    if (utm_source) sessionStorage.setItem('ss_utm_source', utm_source);
    if (utm_campaign) sessionStorage.setItem('ss_utm_campaign', utm_campaign);
    if (utm_medium) sessionStorage.setItem('ss_utm_medium', utm_medium);
    if (utm_content) sessionStorage.setItem('ss_utm_content', utm_content);
    if (utm_term) sessionStorage.setItem('ss_utm_term', utm_term);
    if (campaign_id) sessionStorage.setItem('ss_campaign_id', campaign_id);
    if (adset_id) sessionStorage.setItem('ss_adset_id', adset_id);
    if (ad_id) sessionStorage.setItem('ss_ad_id', ad_id);

    const savedSource = utm_source || sessionStorage.getItem('ss_utm_source') || '';
    const savedCampaign = utm_campaign || sessionStorage.getItem('ss_utm_campaign') || '';
    const savedMedium = utm_medium || sessionStorage.getItem('ss_utm_medium') || '';
    const savedContent = utm_content || sessionStorage.getItem('ss_utm_content') || '';
    const savedTerm = utm_term || sessionStorage.getItem('ss_utm_term') || '';
    const savedCampaignId = campaign_id || sessionStorage.getItem('ss_campaign_id') || '';
    const savedAdsetId = adset_id || sessionStorage.getItem('ss_adset_id') || '';
    const savedAdId = ad_id || sessionStorage.getItem('ss_ad_id') || '';

    // Simple UserAgent detection for tracking
    const ua = navigator.userAgent;
    let browser = 'Other';
    let os = 'Other';
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';

    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iPhone') > -1) os = 'iOS';

    setDeviceInfo({ os, browser });

    const initialUtmLead = {
      utmSource: savedSource || undefined,
      utmMedium: savedMedium || undefined,
      utmCampaign: savedCampaign || undefined,
      utmContent: savedContent || undefined,
      utmTerm: savedTerm || undefined,
      campaignId: savedCampaignId || undefined,
      adsetId: savedAdsetId || undefined,
      adId: savedAdId || undefined,
      anuncio: savedContent || savedAdId || undefined,
      conjunto: savedMedium || undefined,
      campanha: savedCampaign || undefined,
      posicionamento: savedTerm || undefined,
      device: os,
      browser: browser
    };

    leadRef.current = {
      ...leadRef.current,
      ...initialUtmLead
    };

    setLead(prev => ({
      ...prev,
      ...initialUtmLead
    }));
  }, []);

  // Load and initialize marketing and analytics scripts (Meta Pixel, Google Analytics, GTM) on mount
  useEffect(() => {
    const config: IntegrationConfig = getResolvedIntegrationsConfig();

    // 1. Initialize Meta Pixel
    const pixelId = config.metaPixelId || '1378981757464908';
    try {
      // Dynamic script injection for Facebook Pixel if not already present from index.html
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      if ((window as any).fbq) {
        const isAlreadyInitialized = (window as any).__metaPixelInitializedId === pixelId;
        const isPageViewAlreadyTracked = (window as any).__metaPixelPageViewTracked;
        const isAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('admin');

        // Only configure and init if not already initialized with this exact Pixel ID
        if (!isAlreadyInitialized) {
          (window as any).fbq('set', 'autoConfig', false, pixelId);
          (window as any).fbq('init', pixelId);
          (window as any).__metaPixelInitializedId = pixelId;
          console.log('Meta Pixel initialized with ID:', pixelId);
        }

        // Only fire PageView once per page session, and never inside the admin panel
        if (!isPageViewAlreadyTracked && !isAdmin) {
          (window as any).fbq('track', 'PageView');
          (window as any).__metaPixelPageViewTracked = true;
          console.log('Meta Pixel PageView tracked for:', pixelId);
        }
      }
    } catch (e) {
      console.error('Failed to initialize Meta Pixel:', e);
    }

    // 2. Initialize Google Analytics
    if (config.gaTrackingId && config.gaTrackingId !== 'G-XXXXXXXXXX') {
      try {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaTrackingId}`;
        document.head.appendChild(script);

        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
          (window as any).dataLayer.push(arguments);
        }
        (window as any).gtag = gtag;
        (window as any).gtag('js', new Date());
        (window as any).gtag('config', config.gaTrackingId);
        console.log('Google Analytics initialized with ID:', config.gaTrackingId);
      } catch (e) {
        console.error('Failed to initialize Google Analytics:', e);
      }
    }

    // 3. Initialize Google Tag Manager
    if (config.gtmId && config.gtmId !== 'GTM-XXXXXXX') {
      try {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`;
        document.head.appendChild(script);
        console.log('Google Tag Manager initialized with ID:', config.gtmId);
      } catch (e) {
        console.error('Failed to initialize Google Tag Manager:', e);
      }
    }
  }, []);

  // Listen to path changes and hashes to support /admin and #admin routing cleanly
  useEffect(() => {
    const handleLocationRouting = () => {
      const pathSuffix = window.location.pathname;
      const hashVal = window.location.hash;
      if (pathSuffix.endsWith('/admin') || hashVal === '#admin') {
        setIsAdminRoute(true);
      } else {
        setIsAdminRoute(false);
      }
    };

    handleLocationRouting();
    window.addEventListener('hashchange', handleLocationRouting);
    
    // Periodically inspect pathname in case dynamic navigation occurs
    const interval = setInterval(handleLocationRouting, 1000);

    return () => {
      window.removeEventListener('hashchange', handleLocationRouting);
      clearInterval(interval);
    };
  }, []);

  // Filter visible questions dynamically based on dependencies
  const visibleQuestions: Question[] = QUESTIONS_LIST.filter(q => {
    if (!q.dependsOn) return true;
    const parentVal = lead[q.dependsOn.variable];
    return parentVal === q.dependsOn.value;
  });

  const totalQuestionsCount = visibleQuestions.length;
  const FINAL_DATA_STEP = totalQuestionsCount + 1;
  const TOTAL_FUNNEL_STEPS = totalQuestionsCount + 1;
  const currentQuestion: Question | undefined = (currentStep > 0 && currentStep <= totalQuestionsCount)
    ? visibleQuestions[currentStep - 1] 
    : undefined;

  // Sync draft inputs when question changes
  useEffect(() => {
    if (currentQuestion) {
      const activeVariable = currentQuestion.variable;
      const currentVal = leadRef.current[activeVariable];

      if (currentQuestion.type === 'checkbox') {
        setCheckboxValue(Boolean(currentVal));
      } else if (currentQuestion.type === 'multiselect') {
        if (!Array.isArray(currentVal)) {
          leadRef.current = { ...leadRef.current, [activeVariable]: [] };
          setLead(prev => ({ ...prev, [activeVariable]: [] }));
        }
        setInputValue('');
      } else {
        setInputValue((currentVal as string) || '');
      }
      setValidationError(null);

      // Auto-focus input for smoother UX
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [currentStep, currentQuestion]);

  // Handle WhatsApp Brazilian Formatter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (currentQuestion?.type === 'tel') {
      value = maskPhone(value);
    }
    setInputValue(value);
    if (validationError) setValidationError(null);

    // Sync input real-time into leadRef and lead state
    if (currentQuestion) {
      const activeVariable = currentQuestion.variable;
      const val = value.trim();
      leadRef.current = {
        ...leadRef.current,
        [activeVariable]: val
      };
      setLead(prev => ({
        ...prev,
        [activeVariable]: val
      }));
    }
  };

  // Validate current answer
  const validateCurrentAnswer = (): boolean => {
    if (!currentQuestion) return true;

    if (currentQuestion.type === 'checkbox') {
      if (!checkboxValue && currentQuestion.required) {
        setValidationError('Você precisa aceitar os termos de consentimento para continuar.');
        return false;
      }
      return true;
    }

    if (currentQuestion.type === 'multiselect') {
      const selectedArr = leadRef.current[currentQuestion.variable];
      if (currentQuestion.required && (!Array.isArray(selectedArr) || selectedArr.length === 0)) {
        setValidationError('Por favor, selecione pelo menos uma opção para darmos prosseguimento.');
        return false;
      }
      return true;
    }

    const trimmedValue = inputValue.trim();

    if (currentQuestion.required && !trimmedValue) {
      setValidationError('Este campo é obrigatório para darmos prosseguimento.');
      return false;
    }

    if (trimmedValue && currentQuestion.type === 'email') {
      if (!validateEmail(trimmedValue)) {
        setValidationError('Por favor, insira um endereço de e-mail válido.');
        return false;
      }
    }

    if (trimmedValue && currentQuestion.type === 'tel') {
      if (!validatePhone(trimmedValue)) {
        setValidationError('Insira um número de WhatsApp com DDD válido. Ex: (11) 99999-9999.');
        return false;
      }
    }

    return true;
  };

  // Move forward
  const handleNext = () => {
    if (!validateCurrentAnswer()) return;

    // Save answer to state & ref
    if (currentQuestion) {
      const activeVariable = currentQuestion.variable;
      let finalVal: any;
      if (currentQuestion.type === 'checkbox') {
        finalVal = checkboxValue;
      } else if (currentQuestion.type === 'multiselect') {
        finalVal = leadRef.current[activeVariable] || [];
      } else {
        finalVal = inputValue.trim();
      }

      leadRef.current = {
        ...leadRef.current,
        [activeVariable]: finalVal
      };
      setLead(prev => ({
        ...prev,
        [activeVariable]: finalVal
      }));
    }

    // Determine path forward
    if (currentStep < totalQuestionsCount) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Advance to final data capture step
      setCurrentStep(FINAL_DATA_STEP);
    }
  };

  // Triggered when loader finishes (2 seconds)
  const handleLoaderComplete = async () => {
    setIsProcessing(false);
    setIsCompleted(true);
    
    let finalLead: LeadData;
    try {
      finalLead = await saveLeadToDatabase();
      if (!finalLead || !finalLead.id) {
        finalLead = { ...leadRef.current };
      }
    } catch (err) {
      console.error('Error saving lead to database:', err);
      finalLead = { ...leadRef.current };
    }

    const safeLead: LeadData = finalLead || leadRef.current || lead || ({} as LeadData);
    
    // Redirect to configured URL in Admin Panel (or default)
    const config: IntegrationConfig = getResolvedIntegrationsConfig();
    const targetRedirect = config.redirectUrl || "https://contato.seracacau.com.br/";
    
    // Build search query parameters with complete lead details so external apps receive all data
    const plainTextMessage = buildFormattedMessageText(safeLead);
    const encodedWhatsappMessage = buildWhatsAppMessage(safeLead);
    const dddData = getDDDInfo(safeLead.whatsapp || safeLead.telefone || safeLead.ddd);

    const paramObj: Record<string, string> = {
      nome: safeLead.nome || '',
      empresa: safeLead.empresa || '',
      email: safeLead.email || '',
      whatsapp: safeLead.whatsapp || safeLead.telefone || '',
      telefone: safeLead.whatsapp || safeLead.telefone || '',
      ddd: safeLead.ddd || dddData.ddd || '',
      uf: safeLead.uf || dddData.uf || '',
      estado: safeLead.estado || dddData.estado || '',
      regiao: safeLead.regiao || dddData.regiao || '',
      segmento: safeLead.segmento || '',
      trabalhaComCacau: safeLead.trabalhaComCacau || '',
      ja_trabalhou_com_cacau: safeLead.trabalhaComCacau || '',
      faturamento: safeLead.faturamento || '',
      leadScore: String(safeLead.leadScore || 0),
      mensagem: plainTextMessage,
      encodedMessage: encodedWhatsappMessage
    };

    if (safeLead.utmSource) paramObj.utm_source = safeLead.utmSource;
    if (safeLead.utmCampaign) paramObj.utm_campaign = safeLead.utmCampaign;
    if (safeLead.utmMedium) paramObj.utm_medium = safeLead.utmMedium;
    if (safeLead.utmContent) paramObj.utm_content = safeLead.utmContent;
    if (safeLead.utmTerm) paramObj.utm_term = safeLead.utmTerm;
    if (safeLead.campaignId) paramObj.campaign_id = safeLead.campaignId;
    if (safeLead.adsetId) paramObj.adset_id = safeLead.adsetId;
    if (safeLead.adId) paramObj.ad_id = safeLead.adId;
    if (safeLead.utmContent) paramObj.anuncio = safeLead.utmContent;

    const urlParams = new URLSearchParams(paramObj);

    const redirectWithParams = `${targetRedirect}${targetRedirect.includes('?') ? '&' : '?'}${urlParams.toString()}`;
    setComputedRedirectUrl(redirectWithParams);

    // Guaranteed redirection attempting top window and current window
    const doRedirect = () => {
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = redirectWithParams;
        } else {
          window.location.href = redirectWithParams;
        }
      } catch (e) {
        window.location.href = redirectWithParams;
      }
    };

    // Fast 600ms delay so user sees "Diagnóstico Concluído" before auto-redirect
    setTimeout(doRedirect, 600);
  };

  // Save lead details and trigger webhooks
  const saveLeadToDatabase = async (): Promise<LeadData> => {
    const now = new Date();
    const dataCadastro = now.toLocaleDateString('pt-BR');
    const horaCadastro = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Use full up-to-date leadRef object
    const currentLead = { ...leadRef.current };
    const score = calculateLeadScore(currentLead);

    // Automatically detect DDD and Brazilian State (UF) from phone/WhatsApp
    const dddInfo = getDDDInfo(currentLead.whatsapp || currentLead.telefone);

    const finalLead: LeadData = {
      ...currentLead,
      ddd: currentLead.ddd || dddInfo.ddd,
      uf: currentLead.uf || dddInfo.uf,
      estado: currentLead.estado || dddInfo.estado,
      regiao: currentLead.regiao || dddInfo.regiao,
      id: 'L-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: now.toISOString(),
      status: 'Novo',
      leadScore: score,
      dataCadastro,
      horaCadastro,
    };

    leadRef.current = finalLead;
    setLead(finalLead);

    // Save locally
    const existingLeadsRaw = localStorage.getItem('sensesales_leads');
    const existingLeads: LeadData[] = existingLeadsRaw ? JSON.parse(existingLeadsRaw) : [];
    localStorage.setItem('sensesales_leads', JSON.stringify([finalLead, ...existingLeads]));

    // Log tracking
    const existingLogsRaw = localStorage.getItem('sensesales_integration_logs');
    const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    
    const timestamp = now.toLocaleTimeString();
    
    const config: IntegrationConfig = getResolvedIntegrationsConfig();

    const isOldOrDisabledSheetsUrl = (url?: string) => 
      !url || 
      !url.startsWith('http') ||
      url.includes('AKfycbxv8pRSfIliUoL04yyu6qYk7fDVkhbZrgkCUIRwZH4vgrNPH6anVepkCfV5SYWz6uM') ||
      url.includes('AKfycbyJSBeAgSpjnOhdYfHUZbSCSVuAGjuxMrJPjzohtECTipLlDxZsdjWCRv9Rg-NrIu6h') ||
      url.includes('AKfycbwWBZRJxFvksSyLijJhnkk29GOZcFOOIPTPx43K6ttM38sdL-E9XPEA_ZmSxl640mA');

    const hasSheets = !isOldOrDisabledSheetsUrl(config.googleSheetsUrl);

    const newLogs: { id: string; time: string; action: string; status: 'success' | 'warn' | 'error'; message: string }[] = [
      { id: Math.random().toString(), time: timestamp, action: 'Lead Local', status: 'success' as const, message: `Lead de ${finalLead.nome} (${finalLead.empresa}) registrado com sucesso.` },
      { id: Math.random().toString(), time: timestamp, action: 'Meta Pixel', status: 'success' as const, message: `Evento "Lead" enviado com ID: ${finalLead.id}.` },
      { 
        id: Math.random().toString(), 
        time: timestamp, 
        action: 'Google Sheets', 
        status: hasSheets ? ('success' as const) : ('warn' as const), 
        message: hasSheets 
          ? `Disparo efetuado para o Google Sheets App Script.` 
          : `Envio temporariamente desativado (aguardando a nova URL do Google Sheets).` 
      },
      { id: Math.random().toString(), time: timestamp, action: 'Webhooks', status: 'warn' as const, message: `Iniciando disparo assíncrono para os servidores cadastrados.` }
    ];

    // Track analytics/pixel events immediately (synchronously) before slow external webhooks
    try {
      trackLeadEvent(finalLead, config);
    } catch (e) {
      console.error('Error tracking analytics events:', e);
    }

    // Fire off to webhooks
    try {
      await triggerWebhooks(finalLead);
    } catch (e) {
      console.error('Error triggering webhooks:', e);
    }

    // Save to Supabase
    const isSupabaseConfigured = config.supabaseUrl && 
      config.supabaseUrl !== 'https://xyz.supabase.co' && 
      config.supabaseAnonKey && 
      config.supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9...';

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        
        const { error } = await supabase
          .from('leads')
          .insert([
            {
              id: finalLead.id,
              nome: finalLead.nome,
              whatsapp: finalLead.whatsapp,
              email: finalLead.email,
              empresa: finalLead.empresa,
              segmento: finalLead.segmento,
              faturamento: finalLead.faturamento,
              operacaoComercial: finalLead.operacaoComercial,
              origemLeads: finalLead.origemLeads,
              crm: finalLead.crm,
              desafioPrincipal: finalLead.desafioPrincipal,
              momentoEmpresa: finalLead.momentoEmpresa,
              investimentoMarketing: finalLead.investimentoMarketing,
              equipeComercial: finalLead.equipeComercial,
              prazoInicio: finalLead.prazoInicio,
              createdAt: finalLead.createdAt,
              
              // Fallback fields for backwards integration support
              telefone: finalLead.whatsapp || '',
              data_cadastro: dataCadastro,
              hora_cadastro: horaCadastro,
              utm_source: finalLead.utmSource || '',
              utm_medium: finalLead.utmMedium || '',
              utm_campaign: finalLead.utmCampaign || '',
              utm_content: finalLead.utmContent || '',
              utm_term: finalLead.utmTerm || '',
              anuncio: finalLead.utmContent || finalLead.adId || '',
              ad_id: finalLead.adId || '',
              adset_id: finalLead.adsetId || '',
              campaign_id: finalLead.campaignId || '',
              lead_score: score,
              status: 'Novo'
            }
          ]);

        if (error) {
          throw error;
        }

        newLogs.push({
          id: Math.random().toString(),
          time: timestamp,
          action: 'Supabase',
          status: 'success' as const,
          message: `Salvo no banco de dados Supabase com sucesso na tabela "leads".`
        });
      } catch (err: any) {
        console.error('Erro ao salvar no Supabase:', err);
        newLogs.push({
          id: Math.random().toString(),
          time: timestamp,
          action: 'Supabase',
          status: 'error' as const,
          message: `Erro ao salvar no Supabase: ${err.message || err.details || 'Tabela "leads" ou credenciais inválidas'}`
        });
      }
    } else {
      newLogs.push({
        id: Math.random().toString(),
        time: timestamp,
        action: 'Supabase',
        status: 'warn' as const,
        message: `Não enviado: Supabase não está configurado com credenciais válidas.`
      });
    }

    localStorage.setItem('sensesales_integration_logs', JSON.stringify([...newLogs, ...existingLogs].slice(0, 50)));
    return finalLead;
  };

  const trackLeadEvent = (finalLead: LeadData, config: IntegrationConfig) => {
    // 1. Track Meta Pixel (Lead, CompleteRegistration, DiagnosticoConcluido)
    if ((window as any).fbq) {
      try {
        const leadScoreVal = finalLead.leadScore !== undefined ? finalLead.leadScore : 100;
        
        // Standard Lead Event
        (window as any).fbq('track', 'Lead', {
          content_name: 'Diagnóstico Comercial Será Cacau',
          content_category: finalLead.segmento || 'Cacau',
          value: leadScoreVal,
          currency: 'BRL',
          predicted_score: leadScoreVal,
          lead_id: finalLead.id || '',
          status: 'completed'
        });

        // Standard CompleteRegistration Event (broad conversion compatibility)
        (window as any).fbq('track', 'CompleteRegistration', {
          content_name: 'Diagnóstico Concluído',
          currency: 'BRL',
          value: leadScoreVal,
          status: true
        });
        (window as any).__metaPixelLeadTracked = true;

        // Custom Event for detailed event breakdown in Meta Events Manager
        (window as any).fbq('trackCustom', 'DiagnosticoConcluido', {
          nome: finalLead.nome,
          empresa: finalLead.empresa,
          segmento: finalLead.segmento,
          faturamento: finalLead.faturamento,
          score: leadScoreVal,
          id: finalLead.id
        });

        console.log('Meta Pixel Conversion Events ("Lead" & "CompleteRegistration") tracked successfully for lead:', finalLead.id);
      } catch (e) {
        console.error('Error tracking Meta Pixel:', e);
      }
    }

    // 2. Track Google Analytics
    if (config.gaTrackingId && config.gaTrackingId !== 'G-XXXXXXXXXX') {
      if ((window as any).gtag) {
        try {
          (window as any).gtag('event', 'generate_lead', {
            value: finalLead.leadScore,
            currency: 'BRL',
            lead_id: finalLead.id,
            lead_score: finalLead.leadScore
          });
          console.log('Google Analytics Event "generate_lead" tracked.');
        } catch (e) {
          console.error('Error tracking GA:', e);
        }
      }
    }

    // 3. Track Google Tag Manager
    if (config.gtmId && config.gtmId !== 'GTM-XXXXXXX') {
      if ((window as any).dataLayer) {
        try {
          (window as any).dataLayer.push({
            event: 'lead_form_submitted',
            leadId: finalLead.id,
            leadScore: finalLead.leadScore,
            leadName: finalLead.nome,
            leadEmail: finalLead.email,
            leadPhone: finalLead.whatsapp
          });
          console.log('GTM Event "lead_form_submitted" pushed.');
        } catch (e) {
          console.error('Error pushing GTM to dataLayer:', e);
        }
      }
    }
  };

  const triggerWebhooks = async (finalLead: LeadData) => {
    // Collect settings
    const config: IntegrationConfig = getResolvedIntegrationsConfig();

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dataHoraFormatted = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

    const rawScore = finalLead.leadScore !== undefined ? finalLead.leadScore : calculateLeadScore(finalLead);
    const scoreFormatted = `${rawScore}%`;

    const plataforma = finalLead.utmSource || '';
    const conjunto = finalLead.utmMedium || '';
    const campanha = finalLead.utmCampaign || '';
    const anuncio = finalLead.utmContent || finalLead.adId || '';
    const posicionamento = finalLead.utmTerm || '';
    const adId = finalLead.adId || '';
    const adsetId = finalLead.adsetId || '';
    const campaignId = finalLead.campaignId || '';

    const plainTextMessage = buildFormattedMessageText(finalLead);
    const encodedWhatsappMessage = buildWhatsAppMessage(finalLead);

    // Compute / fallback DDD intelligence
    const dddData = getDDDInfo(finalLead.whatsapp || finalLead.telefone || finalLead.ddd);
    const dddVal = finalLead.ddd || dddData.ddd || '';
    const ufVal = finalLead.uf || dddData.uf || '';
    const estadoVal = finalLead.estado || dddData.estado || '';
    const regiaoVal = finalLead.regiao || dddData.regiao || '';
    const estadoUfVal = estadoVal ? `${estadoVal} (${ufVal})` : (ufVal || '');

    // Sheet Lead formatted to match the exact Google Sheet columns and Webhook payloads:
    const formattedLead = {
      // Direct keys matching Apps Script lead properties:
      nome: finalLead.nome || '',
      empresa: finalLead.empresa || '',
      cnpj: finalLead.cnpj || '',
      email: finalLead.email || '',
      whatsapp: finalLead.whatsapp || finalLead.telefone || '',
      telefone: finalLead.whatsapp || finalLead.telefone || '',
      cep: finalLead.cep || '',
      cidade: finalLead.cidade || '',
      instagram: finalLead.instagram || '',
      ddd: dddVal,
      uf: ufVal,
      estado: estadoVal,
      regiao: regiaoVal,
      estado_uf: estadoUfVal,
      estadoUf: estadoUfVal,
      localizacao: estadoUfVal ? `${estadoUfVal}${regiaoVal ? ` - ${regiaoVal}` : ''}` : '',
      segmento: finalLead.segmento || '',
      trabalhaComCacau: finalLead.trabalhaComCacau || '',
      ja_trabalhou_com_cacau: finalLead.trabalhaComCacau || '',
      faturamento: finalLead.faturamento || '',
      operacaoComercial: finalLead.operacaoComercial || '',
      origemLeads: Array.isArray(finalLead.origemLeads) ? finalLead.origemLeads.join(', ') : (finalLead.origemLeads || ''),
      crm: finalLead.crm || '',
      desafioPrincipal: finalLead.desafioPrincipal || '',
      momentoEmpresa: finalLead.momentoEmpresa || '',
      investimentoMarketing: finalLead.investimentoMarketing || '',
      equipeComercial: finalLead.equipeComercial || '',
      prazoInicio: finalLead.prazoInicio || '',
      leadScore: rawScore,
      percentual: scoreFormatted,
      id: finalLead.id || '',
      utmSource: finalLead.utmSource || '',
      utmMedium: finalLead.utmMedium || '',
      utmCampaign: finalLead.utmCampaign || '',
      utmContent: finalLead.utmContent || '',
      utmTerm: finalLead.utmTerm || '',
      anuncio: anuncio,
      conjunto: conjunto,
      campanha: campanha,
      plataforma: plataforma,
      posicionamento: posicionamento,
      adId: adId,
      adsetId: adsetId,
      campaignId: campaignId,

      // Formatted text message containing all responses answered in the form
      mensagem: plainTextMessage,
      message: plainTextMessage,
      resumo: plainTextMessage,
      resumoRespostas: plainTextMessage,
      mensagemWhatsapp: encodedWhatsappMessage,
      whatsappLink: `https://wa.me/5521972736030?text=${encodedWhatsappMessage}`,

      // Column name keys for backwards compatibility and various Sheets formats
      'Data/hora': dataHoraFormatted,
      'Nome': finalLead.nome || '',
      'Nome da empresa': finalLead.empresa || '',
      'Empresa': finalLead.empresa || '',
      'CNPJ': finalLead.cnpj || '',
      'E-mail': finalLead.email || '',
      'Telefone': finalLead.whatsapp || finalLead.telefone || '',
      'WhatsApp': finalLead.whatsapp || finalLead.telefone || '',
      'CEP': finalLead.cep || '',
      'Cidade': finalLead.cidade || '',
      'Instagram': finalLead.instagram || '',
      'Estado': estadoVal,
      'UF': ufVal,
      'DDD': dddVal,
      'Estado / UF': estadoUfVal,
      'Região': regiaoVal,
      'Segmento': finalLead.segmento || '',
      'Já trabalhou com cacau': finalLead.trabalhaComCacau || '',
      'Faturamento': finalLead.faturamento || '',
      '% percentual': scoreFormatted,
      'ID': finalLead.id || '',
      'UTM Source': finalLead.utmSource || '',
      'UTM Medium': finalLead.utmMedium || '',
      'UTM Campaign': finalLead.utmCampaign || '',
      'UTM Content': finalLead.utmContent || '',
      'UTM Term': finalLead.utmTerm || '',
      'Plataforma': plataforma,
      'Conjunto': conjunto,
      'Conjunto de Anúncios': conjunto,
      'Campanha': campanha,
      'Anúncio': anuncio,
      'Anuncio': anuncio,
      'Posicionamento': posicionamento,
      'ID do Anúncio': adId,
      'ID Anúncio': adId,
      'ad_id': adId,
      'adset_id': adsetId,
      'campaign_id': campaignId,
      'utm_source': finalLead.utmSource || '',
      'utm_medium': finalLead.utmMedium || '',
      'utm_campaign': finalLead.utmCampaign || '',
      'utm_content': finalLead.utmContent || '',
      'utm_term': finalLead.utmTerm || '',
      'Mensagem': plainTextMessage,
      dataHora: dataHoraFormatted,
      data_hora: dataHoraFormatted
    };

    const orderedRow = [
      dataHoraFormatted,
      finalLead.nome || '',
      finalLead.empresa || '',
      finalLead.email || '',
      finalLead.whatsapp || finalLead.telefone || '',
      estadoVal ? `${estadoVal} (${ufVal})` : '',
      finalLead.segmento || '',
      finalLead.trabalhaComCacau || '',
      finalLead.faturamento || '',
      scoreFormatted,
      finalLead.id || '',
      finalLead.utmSource || '',     // Coluna O: UTM Source (ex: facebook)
      finalLead.utmMedium || '',     // Coluna P: UTM Medium (ex: {{adset.name}} - Conjunto)
      finalLead.utmCampaign || '',   // Coluna Q: UTM Campaign (ex: {{campaign.name}} - Campanha)
      finalLead.utmContent || '',    // Coluna R: UTM Content (ex: {{ad.name}} - Anúncio)
      finalLead.utmTerm || '',       // Coluna S: UTM Term (ex: {{placement}} - Posicionamento)
      finalLead.adId || ''           // Coluna T: ad_id
    ];

    const payload = {
      event: 'lead.qualified',
      timestamp: new Date().toISOString(),
      lead: formattedLead,
      ...formattedLead,
      ddd: dddVal,
      uf: ufVal,
      estado: estadoVal,
      regiao: regiaoVal,
      estado_uf: estadoUfVal,
      mensagem: plainTextMessage,
      message: plainTextMessage,
      resumo: plainTextMessage,
      mensagemWhatsapp: encodedWhatsappMessage,
      whatsappLink: `https://wa.me/5521972736030?text=${encodedWhatsappMessage}`,
      row: orderedRow,
      values: orderedRow
    };

    // Standard webhook send
    if (config.webhookUrl) {
      try {
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
          keepalive: true
        });
      } catch (e) {}
    }

    // N8N send
    if (config.n8nUrl) {
      try {
        await fetch(config.n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
          keepalive: true
        });
      } catch (e) {}
    }

    // Google Sheets App Script send (matching user's active doPost script)
    const isOldOrDisabledSheets = 
      !config.googleSheetsUrl || 
      !config.googleSheetsUrl.startsWith('http') ||
      config.googleSheetsUrl.includes('AKfycbxv8pRSfIliUoL04yyu6qYk7fDVkhbZrgkCUIRwZH4vgrNPH6anVepkCfV5SYWz6uM') ||
      config.googleSheetsUrl.includes('AKfycbyJSBeAgSpjnOhdYfHUZbSCSVuAGjuxMrJPjzohtECTipLlDxZsdjWCRv9Rg-NrIu6h') ||
      config.googleSheetsUrl.includes('AKfycbwWBZRJxFvksSyLijJhnkk29GOZcFOOIPTPx43K6ttM38sdL-E9XPEA_ZmSxl640mA');

    if (!isOldOrDisabledSheets && config.googleSheetsUrl) {
      try {
        const sheetsPayload = {
          ...formattedLead,
          ...payload,
          lead: {
            nome: finalLead.nome || '',
            empresa: finalLead.empresa || '',
            cnpj: finalLead.cnpj || '',
            CNPJ: finalLead.cnpj || '',
            email: finalLead.email || '',
            whatsapp: finalLead.whatsapp || finalLead.telefone || '',
            telefone: finalLead.whatsapp || finalLead.telefone || '',
            cep: finalLead.cep || '',
            CEP: finalLead.cep || '',
            cidade: finalLead.cidade || '',
            Cidade: finalLead.cidade || '',
            instagram: finalLead.instagram || '',
            Instagram: finalLead.instagram || '',
            ddd: dddVal,
            uf: ufVal,
            estado: estadoVal,
            regiao: regiaoVal,
            estado_uf: estadoUfVal,
            estadoUf: estadoUfVal,
            localizacao: estadoUfVal ? `${estadoUfVal}${regiaoVal ? ` - ${regiaoVal}` : ''}` : '',
            Estado: estadoVal,
            UF: ufVal,
            DDD: dddVal,
            'Estado / UF': estadoUfVal,
            segmento: finalLead.segmento || '',
            trabalhaComCacau: finalLead.trabalhaComCacau || '',
            ja_trabalhou_com_cacau: finalLead.trabalhaComCacau || '',
            faturamento: finalLead.faturamento || '',
            operacaoComercial: finalLead.operacaoComercial || '',
            origemLeads: Array.isArray(finalLead.origemLeads) ? finalLead.origemLeads.join(', ') : (finalLead.origemLeads || ''),
            crm: finalLead.crm || '',
            desafioPrincipal: finalLead.desafioPrincipal || '',
            momentoEmpresa: finalLead.momentoEmpresa || '',
            investimentoMarketing: finalLead.investimentoMarketing || '',
            equipeComercial: finalLead.equipeComercial || '',
            prazoInicio: finalLead.prazoInicio || '',
            leadScore: rawScore,
            percentual: scoreFormatted,
            id: finalLead.id || '',
            utmSource: finalLead.utmSource || '',
            utmMedium: finalLead.utmMedium || '',
            utmCampaign: finalLead.utmCampaign || '',
            utmContent: finalLead.utmContent || '',
            utmTerm: finalLead.utmTerm || '',
            anuncio: anuncio,
            Anuncio: anuncio,
            'Anúncio': anuncio,
            conjunto: conjunto,
            Conjunto: conjunto,
            'Conjunto de Anúncios': conjunto,
            campanha: campanha,
            Campanha: campanha,
            plataforma: plataforma,
            Plataforma: plataforma,
            posicionamento: posicionamento,
            Posicionamento: posicionamento,
            adId: adId,
            adsetId: adsetId,
            campaignId: campaignId,
            'UTM Source': finalLead.utmSource || '',
            'UTM Medium': finalLead.utmMedium || '',
            'UTM Campaign': finalLead.utmCampaign || '',
            'UTM Content': finalLead.utmContent || '',
            'UTM Term': finalLead.utmTerm || '',
            utm_source: finalLead.utmSource || '',
            utm_medium: finalLead.utmMedium || '',
            utm_campaign: finalLead.utmCampaign || '',
            utm_content: finalLead.utmContent || '',
            utm_term: finalLead.utmTerm || '',
            ad_id: adId,
            adset_id: adsetId,
            campaign_id: campaignId,
            mensagem: plainTextMessage,
            message: plainTextMessage,
            resumo: plainTextMessage,
            mensagemWhatsapp: encodedWhatsappMessage,
            whatsappLink: `https://wa.me/5521972736030?text=${encodedWhatsappMessage}`
          },
          // Root-level variables
          nome: finalLead.nome || '',
          empresa: finalLead.empresa || '',
          email: finalLead.email || '',
          whatsapp: finalLead.whatsapp || finalLead.telefone || '',
          telefone: finalLead.whatsapp || finalLead.telefone || '',
          ddd: dddVal,
          uf: ufVal,
          estado: estadoVal,
          regiao: regiaoVal,
          estado_uf: estadoUfVal,
          estadoUf: estadoUfVal,
          Estado: estadoVal,
          UF: ufVal,
          DDD: dddVal,
          'Estado / UF': estadoUfVal,
          localizacao: estadoUfVal ? `${estadoUfVal}${regiaoVal ? ` - ${regiaoVal}` : ''}` : '',
          segmento: finalLead.segmento || '',
          trabalhaComCacau: finalLead.trabalhaComCacau || '',
          ja_trabalhou_com_cacau: finalLead.trabalhaComCacau || '',
          faturamento: finalLead.faturamento || '',
          operacaoComercial: finalLead.operacaoComercial || '',
          origemLeads: Array.isArray(finalLead.origemLeads) ? finalLead.origemLeads.join(', ') : (finalLead.origemLeads || ''),
          crm: finalLead.crm || '',
          desafioPrincipal: finalLead.desafioPrincipal || '',
          momentoEmpresa: finalLead.momentoEmpresa || '',
          investimentoMarketing: finalLead.investimentoMarketing || '',
          equipeComercial: finalLead.equipeComercial || '',
          prazoInicio: finalLead.prazoInicio || '',
          leadScore: rawScore,
          percentual: scoreFormatted,
          id: finalLead.id || '',
          utmSource: finalLead.utmSource || '',
          utmMedium: finalLead.utmMedium || '',
          utmCampaign: finalLead.utmCampaign || '',
          utmContent: finalLead.utmContent || '',
          utmTerm: finalLead.utmTerm || '',
          anuncio: anuncio,
          Anuncio: anuncio,
          'Anúncio': anuncio,
          conjunto: conjunto,
          Conjunto: conjunto,
          'Conjunto de Anúncios': conjunto,
          campanha: campanha,
          Campanha: campanha,
          plataforma: plataforma,
          Plataforma: plataforma,
          posicionamento: posicionamento,
          Posicionamento: posicionamento,
          adId: adId,
          adsetId: adsetId,
          campaignId: campaignId,
          'UTM Source': finalLead.utmSource || '',
          'UTM Medium': finalLead.utmMedium || '',
          'UTM Campaign': finalLead.utmCampaign || '',
          'UTM Content': finalLead.utmContent || '',
          'UTM Term': finalLead.utmTerm || '',
          utm_source: finalLead.utmSource || '',
          utm_medium: finalLead.utmMedium || '',
          utm_campaign: finalLead.utmCampaign || '',
          utm_content: finalLead.utmContent || '',
          utm_term: finalLead.utmTerm || '',
          ad_id: adId,
          adset_id: adsetId,
          campaign_id: campaignId,
          mensagem: plainTextMessage,
          message: plainTextMessage,
          resumo: plainTextMessage,
          mensagemWhatsapp: encodedWhatsappMessage,
          whatsappLink: `https://wa.me/5521972736030?text=${encodedWhatsappMessage}`
        };

        await fetch(config.googleSheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(sheetsPayload),
          mode: 'no-cors',
          keepalive: true
        });
      } catch (e) {
        console.error('Error sending lead to Google Sheets:', e);
      }
    }

    return finalLead;
  };

  // Move backward
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setValidationError(null);
      setFinalFormError(null);
    }
  };

  // Handle choice selection with auto-advance!
  const handleOptionSelect = (option: string) => {
    if (currentQuestion) {
      const activeVariable = currentQuestion.variable;
      leadRef.current = {
        ...leadRef.current,
        [activeVariable]: option
      };
      setLead(prev => ({
        ...prev,
        [activeVariable]: option
      }));
      
      // Auto-advance with visual cue
      setTimeout(() => {
        if (currentStep < totalQuestionsCount) {
          setCurrentStep(prev => prev + 1);
        } else {
          // Advance to final data capture step
          setCurrentStep(FINAL_DATA_STEP);
        }
      }, 250);
    }
  };

  // Handle fields changes in the final step
  const handleFinalFieldChange = (field: string, val: string) => {
    let formattedVal = val;
    if (field === 'whatsapp') {
      formattedVal = maskPhone(val);
    } else if (field === 'cnpj') {
      formattedVal = maskCNPJ(val);
    } else if (field === 'cep') {
      formattedVal = maskCEP(val);
    }

    setFinalForm(prev => ({
      ...prev,
      [field]: formattedVal
    }));

    if (finalFormError) setFinalFormError(null);

    // Auto-fetch address from ViaCEP when 8 digits entered
    if (field === 'cep') {
      const cleanDigits = val.replace(/\D/g, '');
      if (cleanDigits.length === 8) {
        setIsCepLoading(true);
        fetch(`https://viacep.com.br/ws/${cleanDigits}/json/`)
          .then(res => res.json())
          .then(data => {
            if (data && !data.erro) {
              setFinalForm(prev => ({
                ...prev,
                cidade: data.localidade || prev.cidade,
                uf: data.uf || prev.uf
              }));
            }
          })
          .catch(() => {})
          .finally(() => setIsCepLoading(false));
      }
    }
  };

  // Submission handler for final lead data form (matching user's attached design)
  const handleFinalSubmit = () => {
    const nomeTrimmed = finalForm.nome.trim();
    if (!nomeTrimmed || nomeTrimmed.length < 3) {
      setFinalFormError('Por favor, informe seu nome completo.');
      return;
    }
    const empresaTrimmed = finalForm.empresa.trim();
    if (!empresaTrimmed || empresaTrimmed.length < 2) {
      setFinalFormError('Por favor, informe o nome do estabelecimento.');
      return;
    }
    const cleanCnpj = finalForm.cnpj.replace(/\D/g, '');
    if (!cleanCnpj || cleanCnpj.length !== 14) {
      setFinalFormError('Por favor, informe um CNPJ válido com 14 dígitos.');
      return;
    }
    if (!validatePhone(finalForm.whatsapp)) {
      setFinalFormError('Por favor, informe um número de WhatsApp com DDD válido.');
      return;
    }
    if (!validateEmail(finalForm.email)) {
      setFinalFormError('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    const cleanCep = finalForm.cep.replace(/\D/g, '');
    if (!cleanCep || cleanCep.length !== 8) {
      setFinalFormError('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }
    if (!finalForm.cidade.trim()) {
      setFinalFormError('Por favor, informe a cidade do estabelecimento.');
      return;
    }
    if (!finalForm.uf.trim()) {
      setFinalFormError('Por favor, selecione o estado (UF).');
      return;
    }

    setFinalFormError(null);

    const rawInstagram = finalForm.instagram.trim();
    const formattedInstagram = rawInstagram 
      ? (rawInstagram.startsWith('@') ? rawInstagram : `@${rawInstagram}`) 
      : '';

    const dddInfo = getDDDInfo(finalForm.whatsapp);
    const updatedLead: LeadData = {
      ...leadRef.current,
      nome: nomeTrimmed,
      empresa: empresaTrimmed,
      cnpj: finalForm.cnpj.trim(),
      whatsapp: finalForm.whatsapp.trim(),
      telefone: finalForm.whatsapp.trim(),
      email: finalForm.email.trim(),
      cep: finalForm.cep.trim(),
      cidade: finalForm.cidade.trim(),
      uf: finalForm.uf.trim(),
      estado: dddInfo.estado || finalForm.uf.trim(),
      instagram: formattedInstagram,
      ddd: dddInfo.ddd || undefined
    };

    leadRef.current = updatedLead;
    setLead(updatedLead);

    setIsProcessing(true);
  };

  // Handle multi-select choice toggling (no auto-advance allowed!)
  const handleMultiSelectToggle = (option: string) => {
    if (currentQuestion) {
      const variable = currentQuestion.variable;
      const currentSelected = Array.isArray(leadRef.current[variable]) 
        ? (leadRef.current[variable] as string[]) 
        : [];
      
      let updatedSelected: string[];
      if (currentSelected.includes(option)) {
        updatedSelected = currentSelected.filter(val => val !== option);
      } else {
        updatedSelected = [...currentSelected, option];
      }

      leadRef.current = {
        ...leadRef.current,
        [variable]: updatedSelected
      };
      setLead(prev => ({
        ...prev,
        [variable]: updatedSelected
      }));
      setValidationError(null);
    }
  };

  // Intercept Keydown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  // Calculates visible progress across the entire funnel (questions + final form)
  const progressPercent = currentStep === 0 
    ? 0 
    : currentStep === FINAL_DATA_STEP && !isCompleted
      ? 95
      : Math.min(100, Math.round((currentStep / TOTAL_FUNNEL_STEPS) * 100));

  // Opens target sales WhatsApp
  const handleSpeakWithSpecialist = () => {
    const currentLead = leadRef.current?.nome ? leadRef.current : (lead || {} as LeadData);
    const encodedMessage = buildWhatsAppMessage(currentLead);
    const link = `https://wa.me/5521972736030?text=${encodedMessage}`;
    
    // Log WhatsApp redirect audit
    const existingLogsRaw = localStorage.getItem('sensesales_integration_logs');
    const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    const newLog = { 
      id: Math.random().toString(), 
      time: new Date().toLocaleTimeString(), 
      action: 'WhatsApp API', 
      status: 'success' as const, 
      message: `Lead iniciando contato direto no WhatsApp comercial.` 
    };
    localStorage.setItem('sensesales_integration_logs', JSON.stringify([newLog, ...existingLogs].slice(0, 50)));

    window.open(link, '_blank');
  };

  // Handles meeting scheduling callback from BookingCalendar
  const handleBookingComplete = async (date: string, hour: string, meetLink: string) => {
    // 1. Format date safely
    let formattedDate = date;
    if (date && date.includes('-')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    // 2. Set scheduled meeting credentials
    setBookedMeeting({ date, hour, meetLink });
    setShowBookingStep(false);

    // 3. Update active lead state
    let finalLead: LeadData = { ...lead };
    setLead(prev => {
      const updated = {
        ...prev,
        dataReuniao: formattedDate,
        horaReuniao: hour,
        googleMeetLink: meetLink,
        status: 'Reunião agendada' as const
      };
      finalLead = updated;
      return updated;
    });

    // 4. Update locally persisted leads lists
    const existingLeadsRaw = localStorage.getItem('sensesales_leads');
    if (existingLeadsRaw) {
      try {
        const existingLeads: LeadData[] = JSON.parse(existingLeadsRaw);
        const updatedLeads = existingLeads.map(l => l.id === lead.id ? {
          ...l,
          dataReuniao: formattedDate,
          horaReuniao: hour,
          googleMeetLink: meetLink,
          status: 'Reunião agendada' as const
        } : l);
        localStorage.setItem('sensesales_leads', JSON.stringify(updatedLeads));
      } catch (err) {
        console.error('Error updating local storage leads list:', err);
      }
    }

    // 5. Update supabase registry row if configured
    const config: IntegrationConfig = getResolvedIntegrationsConfig();

    const isSupabaseConfigured = config.supabaseUrl && 
      config.supabaseUrl !== 'https://xyz.supabase.co' && 
      config.supabaseAnonKey && 
      config.supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9...';

    if (isSupabaseConfigured) {
      const activeId = lead.id || finalLead.id;
      try {
        const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        const { error } = await supabase
          .from('leads')
          .update({
            data_reuniao: formattedDate,
            hora_reuniao: hour,
            google_meet_link: meetLink,
            status: 'Reunião agendada'
          })
          .eq('id', activeId);

        if (error) throw error;

        // Sync Audit Log
        const existingLogsRaw = localStorage.getItem('sensesales_integration_logs');
        const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
        const newLog = { 
          id: Math.random().toString(), 
          time: new Date().toLocaleTimeString(), 
          action: 'Supabase Update', 
          status: 'success' as const, 
          message: `Lead ${activeId} atualizado para status "Reunião agendada" no Supabase.` 
        };
        localStorage.setItem('sensesales_integration_logs', JSON.stringify([newLog, ...existingLogs].slice(0, 50)));
      } catch (err: any) {
        console.error('Error updating supabase event details:', err);
        const existingLogsRaw = localStorage.getItem('sensesales_integration_logs');
        const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
        const errorLog = { 
          id: Math.random().toString(), 
          time: new Date().toLocaleTimeString(), 
          action: 'Supabase Update', 
          status: 'error' as const, 
          message: `Falha ao atualizar agendamento no Supabase: ${err.message || 'Erro inesperado'}` 
        };
        localStorage.setItem('sensesales_integration_logs', JSON.stringify([errorLog, ...existingLogs].slice(0, 50)));
      }
    }
  };

  // Speaks with representative specifically about the scheduled time
  const handleSpeakWithSpecialistBooked = (date: string, hour: string, meetLink: string) => {
    const currentLead = leadRef.current?.empresa ? leadRef.current : (lead || {} as LeadData);
    let formattedDate = date;
    if (date && date.includes('-')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    
    // Check if hour looks like "Confirmado no Calendly" or similar
    const hourSuffix = hour && (hour.toLowerCase().includes('confirmado') || hour.toLowerCase().includes('calendly'))
      ? ''
      : ` às *${hour}h*`;

    const baseMessage = `Olá! Concluí minha análise estratégica da Será Cacau e agendei nossa reunião estratégica de diagnóstico para o dia *${formattedDate}*${hourSuffix}.

Aqui estão os detalhes da reunião:
📅 Data: ${formattedDate}
⏰ Horário: ${hour}${hour.toLowerCase().includes('confirmado') ? '' : 'h (Horário de Brasília)'}
🎥 Sala do Google Meet: ${meetLink}

O nome da minha empresa é *${currentLead.empresa || 'Não informada'}*.
Gostaria de falar com o estrategista que me atenderá para adiantar alguns pontos!`;

    const encodedMessage = encodeURIComponent(baseMessage);
    const link = `https://wa.me/5521972736030?text=${encodedMessage}`;
    
    window.open(link, '_blank');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    let correctPassword = 'sensesales@admin';
    const storedConfig = localStorage.getItem('sensesales_integrations_config');
    if (storedConfig) {
      try {
        const config: IntegrationConfig = JSON.parse(storedConfig);
        if (config.adminPassword) {
          correctPassword = config.adminPassword;
        }
      } catch (err) {
        console.error('Error parsing config password', err);
      }
    }

    if (adminPasswordInput === correctPassword) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('sensesales_admin_logged_in', 'true');
      setAdminLoginError(null);
    } else {
      setAdminLoginError('Senha incorreta. Por favor verifique e tente novamente.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('sensesales_admin_logged_in');
    setAdminPasswordInput('');
    window.location.hash = '';
    
    // Safely remove /admin from URL if present without refreshing if supported
    if (window.location.pathname.endsWith('/admin')) {
      window.history.pushState(null, '', window.location.pathname.replace(/\/admin$/, ''));
    }
    setIsAdminRoute(false);
  };

  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen grid-overlay bg-[#FAFAF8] flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden">
          {/* Faint background gradients */}
          <div className="absolute inset-0 mesh-gradient pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-8 md:p-10 glass-panel rounded-[32px] border border-gray-200 shadow-sm relative z-10 space-y-6 text-left"
          >
            <div className="text-center space-y-3">
              <img 
                src="/logo.png" 
                alt="Será Cacau" 
                className="h-11 w-auto object-contain mx-auto mb-2 select-none"
              />
              <div className="w-10 h-10 bg-[#008060]/10 border border-[#008060]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-4 h-4 text-[#008060]" />
              </div>
              <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Painel do Integrador</h1>
              <p className="text-xs text-gray-500">
                Insira a senha do administrador cadastrada para controlar webhooks, leads, analytics e tags.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">SENHA DE ACESSO</label>
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminLoginError) setAdminLoginError(null);
                  }}
                  placeholder="Selecione ou insira a senha..."
                  className="w-full text-xs font-mono bg-white border border-gray-300 rounded-2xl p-4 text-gray-900 focus:border-[#008060] focus:outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {adminLoginError && (
                <div className="text-xs text-rose-600 font-sans leading-relaxed bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-center">
                  {adminLoginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-[#008060] hover:bg-[#00664d] text-white font-display font-medium text-sm tracking-wide rounded-2xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '';
                  if (window.location.pathname.endsWith('/admin')) {
                    window.history.pushState(null, '', window.location.pathname.replace(/\/admin$/, ''));
                  }
                  setIsAdminRoute(false);
                }}
                className="text-xs font-mono text-gray-400 hover:text-gray-700 transition-colors"
              >
                ← VOLTAR PARA O DIAGNÓSTICO
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    // Authenticated admin view
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-gray-900 flex flex-col font-sans">
        <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Será Cacau" 
              className="h-8 sm:h-9 w-auto object-contain select-none"
            />
            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center border border-[#14B8A6]/20">
              <Lock className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono text-[#14B8A6] font-bold tracking-widest uppercase block">PAINEL DO ADMINISTRADOR</span>
              <h1 className="text-xs font-display font-medium text-gray-900 tracking-tight">Será Cacau Integrador</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAdminLogout}
              className="text-xs font-mono bg-gray-50 hover:bg-gray-100 px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
            >
              SAIR DO PAINEL (LOGOUT)
            </button>
          </div>
        </header>

        <div className="flex-1 w-full bg-[#FAFAF8]">
          <AdminPanel onClose={handleAdminLogout} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 md:p-10 relative font-sans overflow-y-auto overflow-x-hidden text-neutral-100 selection:bg-white/20 selection:text-white">
      
      {/* Fixed Background Layer with Será Cacau Image at Low Opacity & Cinematic Vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0A0908]">
        {/* User-requested Será Cacau background image with low opacity */}
        <img 
          src="/IMG_5237_copiar.webp" 
          alt="Será Cacau Background" 
          className="w-full h-full object-cover object-center opacity-25 sm:opacity-30 scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Soft ambient radial vignette matching reference image */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(10, 9, 8, 0.45) 0%, rgba(10, 9, 8, 0.82) 65%, rgba(6, 5, 4, 0.98) 100%)'
          }}
        />

        {/* Top & bottom linear gradient scrims for contrast and depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(8, 7, 6, 0.9) 0%, rgba(8, 7, 6, 0.3) 35%, rgba(8, 7, 6, 0.55) 70%, rgba(6, 5, 4, 0.96) 100%)'
          }}
        />

        {/* Subtle warm ambient glow in center */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background: 'radial-gradient(circle at 50% 45%, rgba(180, 115, 60, 0.16) 0%, transparent 60%)'
          }}
        />
      </div>

      {/* Header bar with centered luxury logo lockup */}
      <header className="w-full max-w-4xl mx-auto z-10 pt-4 sm:pt-6 pb-2 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-full">
          <button 
            type="button"
            onClick={() => setCurrentStep(0)}
            className="cursor-pointer focus:outline-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
            title="Será Cacau"
          >
            <img 
              src="/logo.png" 
              alt="Será Cacau" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain select-none brightness-0 invert opacity-95 transition-opacity hover:opacity-100 drop-shadow-md"
              id="header-logo"
            />
          </button>
        </div>

        {/* Discreet Modern Progress Bar below header when in questions */}
        {currentStep > 0 && !isCompleted && !isProcessing && (
          <div className="w-full max-w-2xl mx-auto h-[2.5px] bg-white/15 rounded-full overflow-hidden transition-all duration-300 mt-1">
            <div 
              className="h-full bg-[#C88452] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className={`w-full mx-auto flex-1 flex flex-col items-center justify-center z-10 py-6 my-auto transition-all duration-500 ${
        currentStep === 0 ? 'max-w-4xl px-2 sm:px-0' : currentStep === FINAL_DATA_STEP ? 'max-w-[480px] w-full px-4' : 'max-w-2xl px-2 sm:px-0'
      }`}>
        <AnimatePresence mode="wait">
          
          {/* STATE 0: WELCOME SCREEN (Directly matching user reference mockup) */}
          {currentStep === 0 && !isProcessing && !isCompleted && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ 
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="w-full text-center space-y-8 sm:space-y-10 py-8 md:py-16 relative z-10"
              id="welcome-screen"
            >
              {/* Headline & Subtitle matching authentic Será Cacau brand identity */}
              <div className="space-y-4 sm:space-y-5 max-w-3xl mx-auto w-full px-4">
                <h1 className="font-display font-normal text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[58px] leading-[1.15] text-white tracking-tight antialiased max-w-3xl mx-auto">
                  Tenha na prateleira o produto que o cliente pergunta, comenta e volta para comprar.
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-neutral-300/90 max-w-2xl mx-auto font-sans font-light leading-relaxed antialiased pt-1">
                  Cacau 100% puro da Bahia com alta margem e rotatividade. Diferencie sua gôndola e atenda a maior virada de hábito de consumo da década: a vida além do café.
                </p>
              </div>

              {/* Principal CTA Button matching Será Cacau branding */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3 px-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-10 sm:px-14 py-4 bg-[#C88452] hover:bg-[#B57242] active:bg-[#A46336] text-white font-sans font-semibold text-xs sm:text-sm tracking-[0.18em] uppercase rounded-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-2xl hover:shadow-[#C88452]/25 hover:translate-y-[-1px] active:translate-y-[0px] group"
                  id="btn-start"
                >
                  <span>COMEÇAR DIAGNÓSTICO</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2px] transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>

              {/* Minor metadata */}
              <p className="text-xs font-sans text-neutral-400/80 tracking-wide select-none pt-1">
                Leva menos de 2 minutos
              </p>
            </motion.div>
          )}

          {/* STATE 1: CONVERSATIONAL QUESTIONS IN LUXURY DARK GLASS */}
          {currentStep > 0 && !isProcessing && !isCompleted && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ 
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="w-full text-left space-y-6 p-6 sm:p-9 md:p-11 dark-glass-panel rounded-2xl sm:rounded-[28px] shadow-2xl relative overflow-hidden transition-all duration-300 border border-white/10"
              id={`question-step-${currentStep}`}
            >
              
              {/* Question Title */}
              <div className="mb-2">
                <h2 className="font-display font-medium text-xl sm:text-2xl md:text-3xl leading-snug text-white tracking-tight max-w-2xl">
                  {currentQuestion.title}
                </h2>
              </div>

              {/* INPUT TYPE RENDERING */}
              <div className="space-y-4 pt-2">
                
                {/* 1. Standard text, email & phone inputs */}
                {(currentQuestion.type === 'text' || currentQuestion.type === 'email' || currentQuestion.type === 'tel') && (
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={currentQuestion.type}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={currentQuestion.placeholder}
                      className="w-full bg-white/[0.06] border border-white/20 hover:border-white/40 focus:border-[#C88452] focus:bg-white/[0.1] focus:ring-2 focus:ring-[#C88452]/20 rounded-xl px-5 py-4 text-white text-base md:text-lg transition-all shadow-inner font-sans tracking-wide placeholder:text-neutral-400 outline-none"
                      id={`input-variable-${currentQuestion.variable}`}
                    />
                    
                    {/* Corner checkmark decor if filled and valid */}
                    {inputValue.length > 3 && !validationError && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#C88452]/20 border border-[#C88452]/40 flex items-center justify-center text-[#C88452] animate-scaleIn">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Multiple choice options */}
                {currentQuestion.type === 'select' && currentQuestion.options && (
                  <div className="space-y-3" id={`select-options-${currentQuestion.variable}`}>
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = lead[currentQuestion.variable] === option;
                      const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D...
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOptionSelect(option)}
                          className={`w-full flex items-center justify-between p-4 md:p-5 rounded-xl text-left cursor-pointer transition-all duration-200 border group ${
                            isSelected 
                              ? 'border-[#C88452] bg-[#C88452]/15 text-white shadow-lg' 
                              : 'border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] hover:border-white/30'
                          }`}
                          id={`option-${idx}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-mono transition-all duration-200 ${
                              isSelected 
                                ? 'border-[#C88452] bg-[#C88452] text-white font-bold' 
                                : 'border-white/20 text-neutral-400 group-hover:border-[#C88452]/50 group-hover:text-white'
                            }`}>
                              {optionLetter}
                            </span>
                            <span className={`text-sm md:text-base transition-colors ${isSelected ? 'font-semibold text-white' : 'font-light text-neutral-200 group-hover:text-white'}`}>
                              {option}
                            </span>
                          </div>
                          <div className={`transition-all duration-200 ${isSelected ? 'opacity-100 scale-100 text-[#C88452]' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-neutral-400'}`}>
                            <Check className="w-5 h-5 stroke-[2.5px]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2.1 Multiple-selection options (Multiselect) */}
                {currentQuestion.type === 'multiselect' && currentQuestion.options && (
                  <div className="space-y-3" id={`multiselect-options-${currentQuestion.variable}`}>
                    {currentQuestion.options.map((option, idx) => {
                      const currentSelected = Array.isArray(lead[currentQuestion.variable])
                        ? (lead[currentQuestion.variable] as string[])
                        : [];
                      const isSelected = currentSelected.includes(option);
                      const optionLetter = String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleMultiSelectToggle(option)}
                          className={`w-full flex items-center justify-between p-4 md:p-5 rounded-xl text-left cursor-pointer transition-all duration-200 border group ${
                            isSelected 
                              ? 'border-[#C88452] bg-[#C88452]/15 text-white shadow-lg' 
                              : 'border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] hover:border-white/30'
                          }`}
                          id={`multi-option-${idx}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-mono transition-all duration-200 ${
                              isSelected 
                                ? 'border-[#C88452] bg-[#C88452] text-white font-bold' 
                                : 'border-white/20 text-neutral-400 group-hover:border-[#C88452]/50 group-hover:text-white'
                            }`}>
                              {optionLetter}
                            </span>
                            <span className={`text-sm md:text-base transition-colors ${isSelected ? 'font-semibold text-white' : 'font-light text-neutral-200 group-hover:text-white'}`}>
                              {option}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'border-[#C88452] bg-[#C88452] text-white' 
                                : 'border-white/25 text-transparent group-hover:border-[#C88452]/60'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    <p className="text-[10px] text-neutral-400 font-mono text-center pt-2 select-none">
                      💡 Selecione todas as opções que se aplicam e depois clique em "AVANÇAR"
                    </p>
                  </div>
                )}

                {/* 3. Checkbox standard interface */}
                {currentQuestion.type === 'checkbox' && (
                  <label 
                    className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                      checkboxValue 
                        ? 'bg-[#C88452]/15 border-[#C88452]/40 font-medium text-white' 
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-neutral-300'
                    }`}
                    id="checkbox-wrapper"
                  >
                    <input
                      type="checkbox"
                      checked={checkboxValue}
                      onChange={(e) => {
                        setCheckboxValue(e.target.checked);
                        if (validationError) setValidationError(null);
                      }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                      checkboxValue 
                        ? 'border-[#C88452] bg-[#C88452] text-white' 
                        : 'border-white/30 bg-transparent'
                    }`}>
                      {checkboxValue && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </div>
                    <div>
                      <p className="text-xs text-neutral-300 leading-relaxed select-none">
                        Autorizo o tratamento dos meus dados para contato comercial e análise estratégica da minha empresa.
                      </p>
                    </div>
                  </label>
                )}

              </div>

              {/* Error Warning */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 text-rose-300 bg-rose-950/60 border border-rose-800/60 px-4 py-2.5 rounded-xl text-xs"
                    id="validation-error-alert"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{validationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Interactive buttons */}
              <div className="flex items-center justify-between pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 py-2 text-xs font-mono font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  id="btn-back"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>VOLTAR</span>
                </button>

                {currentQuestion.type !== 'select' && (
                  <div className="flex items-center gap-4">
                    <span className="hidden md:inline-block text-[10px] font-mono text-neutral-400 select-none">
                      (pressione Enter <kbd className="bg-white/10 px-1 py-0.5 rounded border border-white/20 font-sans text-neutral-300">↵</kbd>)
                    </span>
                    
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-7 py-3 bg-[#C88452] hover:bg-[#B57242] active:bg-[#A46336] text-white font-sans font-semibold text-xs tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md hover:translate-y-[-1px]"
                      id="btn-next"
                    >
                      <span>AVANÇAR</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2px]" />
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* STATE 1.5: FINAL LEAD DATA CAPTURE STEP (Matching attached image exactly) */}
          {currentStep === FINAL_DATA_STEP && !isProcessing && !isCompleted && (
            <motion.div
              key="final-data-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ 
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="w-full text-left space-y-4 sm:space-y-4.5"
              id="final-data-step-card"
            >
              {/* 1. NOME COMPLETO */}
              <div>
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                  NOME COMPLETO
                </label>
                <input
                  type="text"
                  value={finalForm.nome}
                  onChange={(e) => handleFinalFieldChange('nome', e.target.value)}
                  placeholder=""
                  autoFocus
                  className="w-full bg-[#181615] border border-white/80 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                  id="final-input-nome"
                />
              </div>

              {/* 2. NOME DO ESTABELECIMENTO */}
              <div>
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                  NOME DO ESTABELECIMENTO
                </label>
                <input
                  type="text"
                  value={finalForm.empresa}
                  onChange={(e) => handleFinalFieldChange('empresa', e.target.value)}
                  placeholder=""
                  className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                  id="final-input-empresa"
                />
              </div>

              {/* 3. CNPJ */}
              <div>
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={finalForm.cnpj}
                  onChange={(e) => handleFinalFieldChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                  id="final-input-cnpj"
                />
              </div>

              {/* 4. WHATSAPP */}
              <div>
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                  WHATSAPP
                </label>
                <input
                  type="tel"
                  value={finalForm.whatsapp}
                  onChange={(e) => handleFinalFieldChange('whatsapp', e.target.value)}
                  placeholder="(31) 90000-0000"
                  className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                  id="final-input-whatsapp"
                />
              </div>

              {/* 5. E-MAIL */}
              <div>
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                  E-MAIL
                </label>
                <input
                  type="email"
                  value={finalForm.email}
                  onChange={(e) => handleFinalFieldChange('email', e.target.value)}
                  placeholder="voce@seunegocio.com.br"
                  className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                  id="final-input-email"
                />
              </div>

              {/* 6. CEP */}
              <div>
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={finalForm.cep}
                  onChange={(e) => handleFinalFieldChange('cep', e.target.value)}
                  placeholder="30000-000"
                  maxLength={9}
                  className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                  id="final-input-cep"
                />
              </div>

              {/* 7. CIDADE & ESTADO */}
              <div className="grid grid-cols-10 gap-3">
                <div className="col-span-7">
                  <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                    CIDADE
                  </label>
                  <input
                    type="text"
                    value={finalForm.cidade}
                    onChange={(e) => handleFinalFieldChange('cidade', e.target.value)}
                    placeholder="Belo Horizonte"
                    className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                    id="final-input-cidade"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                    ESTADO
                  </label>
                  <div className="relative">
                    <select
                      value={finalForm.uf}
                      onChange={(e) => handleFinalFieldChange('uf', e.target.value)}
                      className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-3.5 py-3.5 text-white text-[15px] font-sans font-light outline-none appearance-none cursor-pointer transition-colors"
                      id="final-select-uf"
                    >
                      <option value="" className="bg-[#181615] text-[#52504D]">UF</option>
                      {BRAZILIAN_STATES.map(uf => (
                        <option key={uf} value={uf} className="bg-[#181615] text-white">
                          {uf}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 8. INSTAGRAM DO NEGÓCIO (opcional) */}
              <div>
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.16em] text-[#9A9895] block mb-2">
                  INSTAGRAM DO NEGÓCIO <span className="lowercase font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={finalForm.instagram}
                  onChange={(e) => handleFinalFieldChange('instagram', e.target.value)}
                  placeholder="@seunegocio"
                  className="w-full bg-[#181615] border border-white/10 hover:border-white/20 focus:border-white focus:outline-none rounded-[3px] px-4 py-3.5 text-white text-[15px] font-sans font-light placeholder:text-[#52504D] outline-none transition-colors"
                  id="final-input-instagram"
                />
              </div>

              {/* Error Alert */}
              <AnimatePresence>
                {finalFormError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-rose-300 text-xs font-sans bg-rose-950/60 border border-rose-800/60 px-4 py-2.5 rounded-[3px]"
                    id="final-form-error-alert"
                  >
                    {finalFormError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between pt-5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="text-xs font-sans text-neutral-400 hover:text-white transition-colors cursor-pointer py-2 px-1"
                  id="btn-back-final"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="bg-[#C88452] hover:bg-[#B57242] active:bg-[#A46336] text-white font-display font-medium text-xs tracking-[0.14em] uppercase px-7 py-3.5 rounded-[3px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-[#C88452]/25 hover:translate-y-[-1px]"
                  id="btn-submit-final"
                >
                  <span>SOLICITAR ANÁLISE COMERCIAL</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 2: LOADING/PROCESSING SEQUENCE (2 SECONDS) */}
          {isProcessing && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ 
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="w-full flex justify-center py-6"
            >
              <LoaderStep onComplete={handleLoaderComplete} />
            </motion.div>
          )}

          {/* STATE 3: FINAL REDIRECT SCREEN */}
          {isCompleted && !isProcessing && (
            <motion.div
              key="completed-redirect"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md mx-auto space-y-6 p-7 sm:p-10 dark-glass-panel rounded-2xl sm:rounded-[28px] shadow-2xl border border-white/10 text-center"
              id="redirect-screen"
            >
              <div className="w-16 h-16 bg-[#C88452]/20 border border-[#C88452]/40 rounded-2xl flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Check className="w-8 h-8 text-[#C88452]" />
              </div>
              <div className="space-y-3">
                <h1 className="font-display font-medium text-2xl sm:text-3xl text-white tracking-tight">
                  Diagnóstico Concluído!
                </h1>
                <p className="text-sm text-neutral-300 leading-relaxed font-light">
                  Suas respostas foram salvas com sucesso. Você está sendo direcionado para o atendimento comercial...
                </p>
              </div>
              <div className="flex justify-center items-center gap-1.5 pt-2">
                <div className="w-2.5 h-2.5 bg-[#C88452] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-[#C88452] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-[#C88452] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-[11px] font-sans text-neutral-400">
                Se você não for redirecionado em alguns segundos, <a href={computedRedirectUrl} className="text-[#C88452] font-medium underline underline-offset-2 hover:text-[#E09D6C]">clique aqui</a>.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer bar matching reference aesthetics */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between text-[11px] font-sans text-neutral-400/80 z-10 py-5 px-4 gap-3 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
          <span>SERÁ CACAU © 2026</span>
          <span className="hidden md:inline text-neutral-600">•</span>
          <span className="hover:text-white transition-colors cursor-pointer">POLÍTICA DE PRIVACIDADE</span>
          <span className="hidden md:inline text-neutral-600">•</span>
          <span className="hover:text-white transition-colors cursor-pointer">PREFERÊNCIAS DE COOKIES</span>
          <span className="hidden md:inline text-neutral-600">•</span>
          <span>DIRETRIZES LGPD</span>
        </div>

        {/* Dynamic progress tracker indicator when inside questions */}
        {currentStep > 0 && !isCompleted && !isProcessing && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2.5 w-full md:w-56">
              <span className="shrink-0 text-[10px] font-mono text-[#C88452] font-semibold">{progressPercent}%</span>
              <div className="w-full h-[3px] bg-white/15 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C88452] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </footer>

    </div>
  );
}

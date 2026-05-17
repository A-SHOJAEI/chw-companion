import { useEffect, useReducer, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Gemma4Engine } from './src/lib/cactus';
import { BrandMark } from './src/components/Icons';
import { initDb } from './src/lib/db';
import { on } from './src/lib/events';
import { loadProfile, type ChwProfile } from './src/lib/profile';
import { HomeScreen } from './src/screens/HomeScreen';
import { VisitScreen } from './src/screens/VisitScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { setLanguage, t } from './src/lib/i18n';
import { colors, spacing, typography } from './src/theme';

type Route =
  | { name: 'welcome' }
  | { name: 'home' }
  | { name: 'visit'; sample: boolean }
  | { name: 'result'; visitId: string; wallMs: number }
  | { name: 'history' };

interface AppState {
  route: Route;
  modelReady: boolean;
  modelError: string | null;
  modelLoadProgress: number;
  dbReady: boolean;
  profileResolved: boolean;
}

type Action =
  | { type: 'NAV'; route: Route }
  | { type: 'MODEL_READY' }
  | { type: 'MODEL_ERROR'; message: string }
  | { type: 'MODEL_PROGRESS'; fraction: number }
  | { type: 'DB_READY' }
  | { type: 'PROFILE_RESOLVED'; needsOnboarding: boolean };

const initialState: AppState = {
  route: { name: 'home' },
  modelReady: false,
  modelError: null,
  modelLoadProgress: 0,
  dbReady: false,
  profileResolved: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'NAV':
      return { ...state, route: action.route };
    case 'MODEL_READY':
      return { ...state, modelReady: true, modelError: null };
    case 'MODEL_ERROR':
      return { ...state, modelError: action.message, modelReady: false };
    case 'MODEL_PROGRESS':
      return { ...state, modelLoadProgress: action.fraction };
    case 'DB_READY':
      return { ...state, dbReady: true };
    case 'PROFILE_RESOLVED':
      return {
        ...state,
        profileResolved: true,
        route: action.needsOnboarding ? { name: 'welcome' } : { name: 'home' },
      };
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loadingTitle, setLoadingTitle] = useState(t('boot.openingDb'));
  const [loadingHint, setLoadingHint] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingTitle(t('boot.openingDb'));
        setLoadingHint('');
        await initDb();
        if (cancelled) return;
        dispatch({ type: 'DB_READY' });

        const profile: ChwProfile | null = await loadProfile();
        if (cancelled) return;
        if (profile?.language) setLanguage(profile.language);
        dispatch({ type: 'PROFILE_RESOLVED', needsOnboarding: !profile });

        setLoadingTitle(t('boot.loadingModel'));
        const sideloadPath = '/data/data/org.chwcompanion.app/files/cactus/gemma-4-e4b-it';
        await Gemma4Engine.init({
          localModelPath: sideloadPath,
          registrySlug: 'gemma-4-e4b-it',
          quantization: 'int4',
          onDownloadProgress: (p) => {
            if (cancelled) return;
            dispatch({ type: 'MODEL_PROGRESS', fraction: p });
            if (p < 1) {
              setLoadingTitle(`${t('boot.downloadingWeights')} · ${Math.round(p * 100)}%`);
              setLoadingHint(t('boot.firstLaunchHint'));
            }
          },
        });
        if (cancelled) return;
        dispatch({ type: 'MODEL_READY' });
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e);
        dispatch({ type: 'MODEL_ERROR', message });
      }
    })();
    const offReady = on('model:ready', () => dispatch({ type: 'MODEL_READY' }));
    const offError = on('model:error', (p) =>
      dispatch({ type: 'MODEL_ERROR', message: p.message })
    );
    return () => {
      cancelled = true;
      offReady();
      offError();
    };
  }, []);

  const screen = renderRoute(state, dispatch);
  const showOverlay =
    !state.dbReady ||
    !state.profileResolved ||
    (!state.modelReady && state.route.name === 'home');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bone} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {showOverlay ? (
          <View style={styles.loadingOverlay}>
            <BrandMark size={88} />
            <Text style={styles.loadingBrand}>{t('app.name')}</Text>
            <Text style={styles.loadingTag}>{t('app.tagline')}</Text>
            <ActivityIndicator size="large" color={colors.terracotta} style={styles.loadingSpinner} />
            <Text style={styles.loadingTitle}>{loadingTitle}</Text>
            {loadingHint ? <Text style={styles.loadingHint}>{loadingHint}</Text> : null}
            {state.modelError ? (
              <Text style={styles.errorText}>{state.modelError}</Text>
            ) : null}
          </View>
        ) : null}
        {screen}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function renderRoute(state: AppState, dispatch: React.Dispatch<Action>): React.ReactElement {
  switch (state.route.name) {
    case 'welcome':
      return (
        <WelcomeScreen
          onComplete={() => dispatch({ type: 'NAV', route: { name: 'home' } })}
        />
      );
    case 'home':
      return (
        <HomeScreen
          modelReady={state.modelReady}
          onStartVisit={() => dispatch({ type: 'NAV', route: { name: 'visit', sample: false } })}
          onStartSampleVisit={() =>
            dispatch({ type: 'NAV', route: { name: 'visit', sample: true } })
          }
          onOpenHistory={() => dispatch({ type: 'NAV', route: { name: 'history' } })}
        />
      );
    case 'visit':
      return (
        <VisitScreen
          useSampleData={state.route.sample}
          onResult={(visitId, wallMs) =>
            dispatch({ type: 'NAV', route: { name: 'result', visitId, wallMs } })
          }
          onCancel={() => dispatch({ type: 'NAV', route: { name: 'home' } })}
        />
      );
    case 'result':
      return (
        <ResultScreen
          visitId={state.route.visitId}
          wallMs={state.route.wallMs}
          onDone={() => dispatch({ type: 'NAV', route: { name: 'home' } })}
        />
      );
    case 'history':
      return (
        <HistoryScreen
          onBack={() => dispatch({ type: 'NAV', route: { name: 'home' } })}
          onOpenVisit={(id) =>
            dispatch({ type: 'NAV', route: { name: 'result', visitId: id, wallMs: 0 } })
          }
        />
      );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  loadingBrand: {
    ...typography.display,
    color: colors.terracotta,
    marginTop: spacing.lg,
  },
  loadingTag: { ...typography.body, color: colors.slate, marginBottom: spacing.xxl, fontStyle: 'italic' },
  loadingSpinner: { marginBottom: spacing.lg },
  loadingTitle: { ...typography.bodyLg, color: colors.deepIndigo, textAlign: 'center' },
  loadingHint: { ...typography.caption, color: colors.slate, textAlign: 'center', marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.clinicRed, textAlign: 'center', marginTop: spacing.lg },
});

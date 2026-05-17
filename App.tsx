import { useEffect, useReducer, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Gemma4Engine } from './src/lib/cactus';
import { initDb } from './src/lib/db';
import { on } from './src/lib/events';
import { HomeScreen } from './src/screens/HomeScreen';
import { VisitScreen } from './src/screens/VisitScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { colors, spacing, typography } from './src/theme';

type Route =
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
}

type Action =
  | { type: 'NAV'; route: Route }
  | { type: 'MODEL_READY' }
  | { type: 'MODEL_ERROR'; message: string }
  | { type: 'MODEL_PROGRESS'; fraction: number }
  | { type: 'DB_READY' };

const initialState: AppState = {
  route: { name: 'home' },
  modelReady: false,
  modelError: null,
  modelLoadProgress: 0,
  dbReady: false,
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
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loadingMessage, setLoadingMessage] = useState('Starting…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMessage('Opening encrypted database…');
        await initDb();
        if (cancelled) return;
        dispatch({ type: 'DB_READY' });

        setLoadingMessage('Loading Gemma 4 weights…');
        // Model identification:
        //  - If MODEL_LOCAL_PATH env or sideloaded path is detected, prefer it.
        //  - Otherwise fall back to registry slug; cactus-react-native will
        //    download from HuggingFace on first launch.
        // For the hackathon emulator demo, sideload to the path below before
        // launch:
        //   adb push <unzipped weights dir> /data/data/org.chwcompanion.app/files/cactus/gemma-4-e4b-it
        const sideloadPath = '/data/data/org.chwcompanion.app/files/cactus/gemma-4-e4b-it';
        await Gemma4Engine.init({
          localModelPath: sideloadPath,
          registrySlug: 'gemma-4-e4b-it',
          quantization: 'int4',
          onDownloadProgress: (p) => {
            if (!cancelled) {
              dispatch({ type: 'MODEL_PROGRESS', fraction: p });
              setLoadingMessage(`Downloading weights · ${Math.round(p * 100)}%`);
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

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bone} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {!state.dbReady || (!state.modelReady && state.route.name === 'home') ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.terracotta} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
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
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  loadingText: { ...typography.bodyLg, color: colors.deepIndigo, textAlign: 'center' },
  errorText: { ...typography.body, color: colors.clinicRed, textAlign: 'center' },
});

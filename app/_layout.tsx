import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/config/theme';
import '@/localization/i18n';
import { loadSave } from '@/services/save/saveService';

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);

  // Save yüklənməmiş ekran göstərilmir — əks halda oyunçu bir an üçün
  // sıfır coin görür, sonra rəqəm dəyişir.
  useEffect(() => {
    let cancelled = false;

    loadSave()
      .catch((error) => {
        // Save oxunmasa belə oyun açılmalıdır (docs/DECISIONS.md §15).
        console.warn('[bootstrap] save yüklənmədi, default profil ilə davam edilir:', error);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {loaded ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentStrong} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

import { Image,StyleSheet } from 'react-native'

import { HelloWave } from '@/components/HelloWave'
import ParallaxScrollView from '@/components/ParallaxScrollView'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import Constants from 'expo-constants'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect,useState } from 'react'

export default function HomeScreen() {
  const db = useSQLiteContext()
  const [foos, setFoos] = useState<number[] | undefined>(undefined);

  useEffect(() => {
    db.getAllAsync<{id: number}>('select id from foos', [])
      .then(results => setFoos(results.map(row => row.id)))
  }, [])

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.flex}>
        <ThemedText type="defaultSemiBold">Version:</ThemedText>
        <ThemedText>{Constants.expoConfig?.version}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.flex}>
        <ThemedText type="defaultSemiBold">Runtime:</ThemedText>
        <ThemedText>{Constants.expoConfig?.runtimeVersion?.toString()}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          {foos === undefined && 'Loading foos from DB...'}
          {foos !== undefined && `There are ${foos.length} foos in the database:`}
        </ThemedText>
        {foos !== undefined && foos.length > 0 && (
            <ThemedView>
              {foos.map(x => <ThemedText key={x}>    - {x}</ThemedText>)}
            </ThemedView>
          )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex: {
    flexDirection: 'row',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

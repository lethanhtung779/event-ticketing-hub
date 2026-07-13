import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import type { Event } from '../types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

const { width } = Dimensions.get('window')
const BANNER_HEIGHT = width * 0.45

interface BannerSliderProps {
  events: Event[]
  onPress: (id: string) => void
}

export default function BannerSlider({ events, onPress }: BannerSliderProps) {
  const scrollRef = useRef<ScrollView>(null)
  const [current, setCurrent] = useState(0)
  const items = events.filter((e) => e.bannerUrl).slice(0, 5)
  const len = items.length

  const next = useCallback(() => {
    const nextIdx = (current + 1) % len
    setCurrent(nextIdx)
    scrollRef.current?.scrollTo({ x: nextIdx * width, animated: true })
  }, [current, len])

  useEffect(() => {
    if (len <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [len, next])

  const onMomentumEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width)
    setCurrent(idx)
  }

  if (len === 0) return null

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {items.map((event) => (
          <TouchableOpacity key={event.id} activeOpacity={0.9} onPress={() => onPress(event.id)}>
            <Image
              source={{ uri: event.bannerUrl?.startsWith('http') ? event.bannerUrl : `${API_BASE_URL}${event.bannerUrl}` }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
              <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {len > 1 && (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  image: { width, height: BANNER_HEIGHT },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 24, paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  location: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  dots: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 18, backgroundColor: '#fff' },
})

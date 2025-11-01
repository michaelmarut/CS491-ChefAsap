import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import getEnvVars from '../../config';
import Button from '../components/Button';

const START_HOUR = 6;   // 6 AM
const END_HOUR = 22;    // 10 PM
const STEP_MIN = 30;    // minutes per slot
const SLOT_HEIGHT = 40; // px per slot
const PX_PER_MIN = SLOT_HEIGHT / STEP_MIN; // pixels per minute

// sizing for wide day columns + fixed time column
const TIME_COL_WIDTH = 68;
const DAY_COLUMN_WIDTH = 100;
const HEADER_HEIGHT = 50;
const FOOTER_PADDING = 12;
const DATE_HEADER_TEXT_STYLE = { color: '#111827', fontSize: 13, fontWeight: '600' };

// Dev mock data flag
const DEV_MOCK_BOOKINGS = true;

// Helpers
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const formatHeader = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function formatHourLabel(d) {
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
}

function parseLocalDateTime(dateStr, timeStr) {
  try {
    const [y, m, d] = (dateStr || '').split('-').map(Number);
    const [hh, mm] = (timeStr || '').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  } catch {
    return new Date();
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekDays(baseDate) {
  const monday = getWeekStart(baseDate);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function buildTimeSlotsForDay(dayDate) {
  const slots = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += STEP_MIN) {
      const start = new Date(dayDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + STEP_MIN);
      slots.push({ start, end });
    }
  }
  return slots;
}

// demo booking inside the current week
function buildMockEvents(baseDate) {
  const monday = getWeekStart(baseDate);
  const mockStart = new Date(monday);
  mockStart.setDate(monday.getDate() + 2); // Wednesday
  mockStart.setHours(18, 0, 0, 0);         // 6:00 PM
  const mockEnd = new Date(mockStart);
  mockEnd.setMinutes(mockStart.getMinutes() + 60); // 1 hour

  return [
    {
      id: 'mock-1',
      startDate: mockStart,
      endDate: mockEnd,
      notes: 'Demo booking',
      status: 'scheduled',
      chef_id: 1,
      customer_id: 1,
      title: 'Italian (dinner)',
    },
  ];
}

export default function BookingsScreen() {
  const { apiUrl } = getEnvVars();
  const { token, userType, profileId } = useAuth();

  const BOOKING_API_PREFIX = `${apiUrl}/booking`;

  const [baseDate, setBaseDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');

  const weekDays = useMemo(() => buildWeekDays(baseDate), [baseDate]);

  const listEndpoint = useMemo(() => {
    if (!token || !userType || !profileId) return null;
    if (userType === 'customer') {
      return `${BOOKING_API_PREFIX}/customer/${profileId}/dashboard`;
    }
    return null;
  }, [BOOKING_API_PREFIX, token, userType, profileId]);

  const loadBookings = useCallback(async () => {
    // mock data for testing UI
    if (DEV_MOCK_BOOKINGS) {
      setEvents(buildMockEvents(baseDate));
      return;
    }

    if (!token || !userType || !profileId) return;
    if (!listEndpoint) {
      if (userType === 'chef') {
        Alert.alert('Info', 'Chef bookings endpoint not available yet.');
      }
      return;
    }
    try {
      const res = await fetch(listEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      // booking_bp dashboard shape: { success, data: { previous_bookings, todays_bookings, upcoming_bookings }, counts }
      const prev = data?.data?.previous_bookings ?? [];
      const today = data?.data?.todays_bookings ?? [];
      const upcoming = data?.data?.upcoming_bookings ?? [];
      const raw = [...prev, ...today, ...upcoming];

      const evts = raw.map((b) => {
        const start = parseLocalDateTime(b.booking_date, b.booking_time);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // assume 1-hour duration
        return {
          id: b.booking_id ?? b.id ?? Math.random().toString(36).slice(2),
          startDate: start,
          endDate: end,
          notes: b.special_notes ?? b.notes ?? '',
          status: b.status ?? 'scheduled',
          chef_id: b.chef_id,
          customer_id: b.customer_id,
          title: b.cuisine_type
            ? `${b.cuisine_type} ${b.meal_type ? `(${b.meal_type})` : ''}`.trim()
            : 'Booking',
        };
      });

      setEvents(evts);
    } catch {
      Alert.alert('Error', 'Network error. Could not load bookings.');
      setEvents([]);
    }
  }, [DEV_MOCK_BOOKINGS, baseDate, listEndpoint, token, userType, profileId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const onPrevWeek = () => setBaseDate((d) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() - 7);
    return nd;
  });
  const onNextWeek = () => setBaseDate((d) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + 7);
    return nd;
  });
  const onToday = () => setBaseDate(new Date());

  const openEvent = (evt) => {
    setSelected(evt);
    setNotes(evt?.notes || '');
  };

  // Disabled until backend provides endpoints
  const saveNotes = async () => {
    Alert.alert('Not available', 'Update booking endpoint is not implemented on backend.');
  };
  const cancelBooking = async () => {
    Alert.alert('Not available', 'Cancel booking endpoint is not implemented on backend.');
  };

  const eventsByDay = useMemo(() => {
    const map = Array.from({ length: 7 }).map(() => []);
    const monday = getWeekStart(baseDate); // compute once
    events.forEach((e) => {
      const d = new Date(e.startDate);
      const idx = Math.floor(
        getWeekStart(d).getTime() === monday.getTime()
          ? (d.getDay() + 6) % 7
          : Math.round((d - monday) / (24 * 3600 * 1000))
      );
      if (idx >= 0 && idx < 7) {
        map[idx].push(e);
      }
    });
    return map;
  }, [events, baseDate]);

  // Add refs for syncing horizontal scroll
  const headerHScrollRef = useRef(null);
  const gridHScrollRef = useRef(null);
  const syncSourceRef = useRef(null); // 'header' | 'grid' | null

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Week controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, paddingTop: 12, borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
          Week of {formatHeader(weekDays[0])}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={onPrevWeek}
            style={{ paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: 'transparent', borderRadius: 8, marginRight: 6 }}
          >
            <Text style={{ fontSize: 14, color: '#111827' }}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToday}
            style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#d1fae5', borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: '#86efac' }}
          >
            <Text style={{ fontSize: 14, color: '#065f46', fontWeight: '600' }}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNextWeek}
            style={{ paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: 'transparent', borderRadius: 8 }}
          >
            <Text style={{ fontSize: 14, color: '#111827' }}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed day header that scrolls horizontally with the grid */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
        {/* Left spacer so header aligns with the grid (time column) */}
        <View style={{ width: TIME_COL_WIDTH, height: HEADER_HEIGHT, borderRightWidth: 1, borderColor: '#e5e7eb' }} />
        <ScrollView
          ref={headerHScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}             // allow dragging header
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            if (syncSourceRef.current === 'grid') return;
            syncSourceRef.current = 'header';
            gridHScrollRef.current?.scrollTo({ x, animated: false });
          }}
          onScrollEndDrag={() => { syncSourceRef.current = null; }}
          onMomentumScrollEnd={() => { syncSourceRef.current = null; }}
        >
          <View style={{ width: DAY_COLUMN_WIDTH * 7 }}>
            <View style={{ height: HEADER_HEIGHT, flexDirection: 'row', backgroundColor: '#fff' }}>
              {weekDays.map((d, i) => (
                <View
                  key={i}
                  style={{
                    width: DAY_COLUMN_WIDTH,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeftWidth: i === 0 ? 0 : 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <Text style={DATE_HEADER_TEXT_STYLE}>{formatHeader(d)}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* One vertical scroller for both time and grid; right side is the only horizontal scroller */}
      <ScrollView
        nestedScrollEnabled
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingBottom: FOOTER_PADDING }}
      >
        <View style={{ flexDirection: 'row' }}>
          {/* LEFT: fixed time column (not horizontally scrollable) */}
          <View style={{ width: TIME_COL_WIDTH, borderRightWidth: 1, borderColor: '#e5e7eb' }}>
            {/* Time grid background + hour labels aligned to hour lines */}
            {(() => {
              const timeSlots = buildTimeSlotsForDay(weekDays[0]);
              const gridHeight = timeSlots.length * SLOT_HEIGHT;

              return (
                <View style={{ position: 'relative', backgroundColor: '#fff' }}>
                  {/* Background: ONLY hour lines */}
                  {timeSlots.map((slot, idx) => {
                    const isHour = slot.start.getMinutes() === 0;
                    return (
                      <View
                        key={idx}
                        style={{
                          height: SLOT_HEIGHT,
                          backgroundColor: '#fff',
                          borderTopWidth: isHour ? 2 : 0,
                          borderTopColor: '#e5e7eb',
                        }}
                      />
                    );
                  })}

                  {/* Hour labels overlay on the hour lines */}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: gridHeight, pointerEvents: 'none' }}>
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                      const hour = START_HOUR + i;
                      if (hour > END_HOUR) return null;
                      const labelDate = new Date(weekDays[0]);
                      labelDate.setHours(hour, 0, 0, 0);
                      const top = i * 60 * PX_PER_MIN;
                      return (
                        <Text
                          key={hour}
                          style={{
                            position: 'absolute',
                            top: Math.max(top - 8, 0),
                            right: 8,
                            color: '#111827',
                            fontSize: 13,
                            fontWeight: '600',
                            textAlign: 'right',
                          }}
                        >
                          {formatHourLabel(labelDate)}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              );
            })()}
          </View>

          {/* RIGHT: grid inside a horizontal scroller; sync its x with the fixed header above */}
          <ScrollView
            ref={gridHScrollRef}
            horizontal
            showsHorizontalScrollIndicator
            bounces={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              if (syncSourceRef.current === 'header') return;
              syncSourceRef.current = 'grid';
              headerHScrollRef.current?.scrollTo({ x, animated: false });
            }}
            onScrollEndDrag={() => { syncSourceRef.current = null; }}
            onMomentumScrollEnd={() => { syncSourceRef.current = null; }}
          >
            <View style={{ width: DAY_COLUMN_WIDTH * 7 }}>
              {/* (Removed) Header row here; it's now fixed above */}

              {/* Grid: background + events overlay */}
              <View style={{ flexDirection: 'row' }}>
                {weekDays.map((day, dayIdx) => {
                  const daySlots = buildTimeSlotsForDay(day);
                  const dayEvents = eventsByDay[dayIdx] || [];

                  // Bounds for clipping events to visible day window
                  const dayStart = new Date(day);
                  dayStart.setHours(START_HOUR, 0, 0, 0);
                  const dayEnd = new Date(day);
                  dayEnd.setHours(END_HOUR, 0, 0, 0);

                  const gridHeight = daySlots.length * SLOT_HEIGHT;

                  return (
                    <View
                      key={dayIdx}
                      style={{
                        width: DAY_COLUMN_WIDTH,
                        borderLeftWidth: dayIdx === 0 ? 0 : 1,
                        borderColor: '#e5e7eb',
                        position: 'relative',
                      }}
                    >
                      {/* Background grid (hour line on top, thin half-hour line) */}
                      {daySlots.map((slot, sIdx) => {
                        const isHour = slot.start.getMinutes() === 0;
                        return (
                          <View
                            key={sIdx}
                            style={{
                              height: SLOT_HEIGHT,
                              borderTopWidth: isHour ? 2 : 0,
                              borderTopColor: '#e5e7eb',
                              borderBottomWidth: 1,
                              borderBottomColor: '#f3f4f6',
                              backgroundColor: isHour ? '#ffffff' : '#fafafa',
                            }}
                          />
                        );
                      })}

                      {/* Events overlay: single block spans multi-slots */}
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: gridHeight }} pointerEvents="box-none">
                        {dayEvents.map((evt) => {
                          const start = new Date(evt.startDate);
                          const end = new Date(evt.endDate);
                          const clippedStart = start < dayStart ? dayStart : start;
                          const clippedEnd = end > dayEnd ? dayEnd : end;

                          // Skip if outside visible window
                          if (clippedEnd <= clippedStart) return null;

                          // Position and size in the grid
                          const minutesFromDayStart = (clippedStart - dayStart) / 60000;
                          const durationMin = (clippedEnd - clippedStart) / 60000;
                          const top = minutesFromDayStart * PX_PER_MIN;
                          const height = Math.max(durationMin * PX_PER_MIN - 4, 24); // keep a minimum height

                          // Simple status color mapping
                          const status = evt.status || 'scheduled';
                          const bg =
                            status === 'cancelled' ? '#fee2e2' :
                            status === 'completed' ? '#dcfce7' :
                            '#dbeafe'; // scheduled/default
                          const border =
                            status === 'cancelled' ? '#ef4444' :
                            status === 'completed' ? '#10b981' :
                            '#3b82f6';

                          return (
                            <TouchableOpacity
                              key={evt.id || `${start.getTime()}-${end.getTime()}`}
                              onPress={() => openEvent(evt)}
                              activeOpacity={0.8}
                              style={{
                                position: 'absolute',
                                top,
                                left: 4,
                                right: 4,
                                height,
                                backgroundColor: bg,
                                borderLeftWidth: 3,
                                borderLeftColor: border,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 6,
                                overflow: 'hidden',
                              }}
                            >
                              <Text style={{ color: '#111827', fontSize: 12, fontWeight: '600' }}>
                                {formatTime(clippedStart)}–{formatTime(clippedEnd)} {evt.title || 'Booking'}
                              </Text>
                              {!!evt.notes && (
                                <Text numberOfLines={1} style={{ color: '#374151', fontSize: 12, marginTop: 2 }}>
                                  {evt.notes}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Event details modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelected(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Backdrop: tap anywhere outside the card to close */}
          <Pressable
            onPress={() => setSelected(null)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              elevation: 4,
            }}
          >
            {/* Header: close button + title */}
            <View
              style={{
                padding: 16,
                paddingBottom: 0,
                borderBottomWidth: 1,
                borderColor: '#e5e7eb',
                position: 'relative',
              }}
            >
              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={{ position: 'absolute', top: 12, right: 12, padding: 8, zIndex: 2 }}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={{ fontSize: 18, color: '#111827' }}>✕</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                {selected?.title || 'Booking Details'}
              </Text>
            </View>

            {/* Body: time, notes, buttons */}
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                {selected?.startDate ? `Starts at ${formatTime(new Date(selected.startDate))}` : ''}
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                {selected?.endDate ? `Ends at ${formatTime(new Date(selected.endDate))}` : ''}
              </Text>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Special notes or requests"
                style={{
                  height: 40,
                  borderColor: '#d1d5db',
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  marginBottom: 16,
                  backgroundColor: '#fafafa',
                }}
              />

              <Button
                title="Save Notes"
                onPress={saveNotes}
                style={{ marginBottom: 12 }}
                disabled
              />
              <Button
                title="Cancel Booking"
                onPress={cancelBooking}
                color="#ef4444"
                style={{ marginBottom: 12 }}
                disabled
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import getEnvVars from '../../config';
import Button from '../components/Button';
import CalendarIcsUploadButton from '../components/CalendarIcsUploadButton';
import CalendarConnectButton from '../components/CalendarConnectButton';

const START_HOUR = 6;   // 6 AM
const END_HOUR = 22;    // 10 PM
const STEP_MIN = 30;    // minutes per slot
const SLOT_HEIGHT = 40; // px per slot

// set to false for production
const DEV_MOCK_BOOKINGS = true;

// Helpers
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const formatHeader = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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

function overlaps(slotStart, slotEnd, evStart, evEnd) {
  return evStart < slotEnd && evEnd > slotStart;
}

export default function BookingsScreen() {
  const { apiUrl } = getEnvVars();
  const { token, userType, profileId } = useAuth();

  const BOOKING_API_PREFIX = `${apiUrl}/booking`;

  const [baseDate, setBaseDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');

  const weekDays = useMemo(() => buildWeekDays(baseDate), [baseDate]);
  const weekRange = useMemo(() => {
    const start = new Date(weekDays[0]);
    const end = new Date(weekDays[6]);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [weekDays]);

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

    if (!token || !userType || !profileId) return; // wait until AuthContext is ready
    if (!listEndpoint) {
      if (userType === 'chef') {
        Alert.alert('Info', 'Chef bookings endpoint not available yet.');
      }
      return;
    }
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    events.forEach((e) => {
      const d = new Date(e.startDate);
      const monday = getWeekStart(baseDate);
      const idx = Math.floor((getWeekStart(d).getTime() === monday.getTime())
        ? (d.getDay() + 6) % 7
        : (Math.round((d - monday) / (24 * 3600 * 1000))));
      if (idx >= 0 && idx < 7) {
        map[idx].push(e);
      }
    });
    return map;
  }, [events, baseDate]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* External calendar actions */}
      <View style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontWeight: '600', fontSize: 14, marginBottom: 6, color: '#111827' }}>External Calendar</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <View style={{ marginRight: 8, marginBottom: 6 }}>
            <CalendarConnectButton compact onSynced={() => { /* optionally reload bookings */ }} />
          </View>
          <View style={{ marginRight: 8, marginBottom: 6 }}>
            <CalendarIcsUploadButton compact />
          </View>
        </View>
      </View>

      {/* Week controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
          Week of {formatHeader(weekDays[0])}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={onPrevWeek}
            style={{ paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: 'transparent', borderRadius: 6, marginRight: 6 }}
          >
            <Text style={{ fontSize: 13, color: '#111827' }}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToday}
            style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#d1fae5', borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#86efac' }}
          >
            <Text style={{ fontSize: 13, color: '#065f46', fontWeight: '600' }}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNextWeek}
            style={{ paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: 'transparent', borderRadius: 6 }}
          >
            <Text style={{ fontSize: 13, color: '#111827' }}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Headers row */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
        <View style={{ width: 56, paddingVertical: 8 }} />
        {weekDays.map((d, i) => (
          <View key={i} style={{ flex: 1, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', color: '#374151' }}>{formatHeader(d)}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row' }}>
          {/* Time labels */}
          <View style={{ width: 56 }}>
            {buildTimeSlotsForDay(weekDays[0]).map((slot, idx) => (
              <View key={idx} style={{ height: SLOT_HEIGHT, justifyContent: 'flex-start', alignItems: 'center' }}>
                {slot.start.getMinutes() === 0 ? (
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>{pad(slot.start.getHours())}:00</Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* Day columns */}
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {weekDays.map((day, dayIdx) => {
              const daySlots = buildTimeSlotsForDay(day);
              const dayEvents = eventsByDay[dayIdx] || [];
              return (
                <View key={dayIdx} style={{ flex: 1, borderLeftWidth: dayIdx === 0 ? 0 : 1, borderColor: '#e5e7eb' }}>
                  {daySlots.map((slot, sIdx) => {
                    const evt = dayEvents.find((e) => overlaps(slot.start, slot.end, e.startDate, e.endDate));
                    const isHour = slot.start.getMinutes() === 0;
                    return (
                      <TouchableOpacity
                        key={sIdx}
                        activeOpacity={evt ? 0.7 : 1}
                        onPress={() => evt && openEvent(evt)}
                        style={{
                          height: SLOT_HEIGHT,
                          borderBottomWidth: 1,
                          borderColor: '#f3f4f6',
                          backgroundColor: evt
                            ? (evt.status === 'cancelled' ? '#e5e7eb' : '#d9f99d')
                            : (isHour ? '#ffffff' : '#fafafa'),
                          paddingHorizontal: 6,
                          justifyContent: 'center',
                        }}
                      >
                        {evt && (
                          <View>
                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: '#14532d' }}>
                              {evt.title}
                            </Text>
                            <Text numberOfLines={1} style={{ fontSize: 11, color: '#065f46' }}>
                              {formatTime(evt.startDate)} - {formatTime(evt.endDate)}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={{ padding: 12, borderTopWidth: 1, borderColor: '#e5e7eb', gap: 8 }}>
        <Button
          title={loading ? 'Refreshing…' : 'Refresh'}
          style="primary"
          onPress={loadBookings}
        />
        {userType === 'customer' && (
          <Button
            title="View My Bookings"
            style="secondary"
            href="/CustomerBookingsScreen"
          />
        )}
        {userType === 'chef' && (
          <Button
            title="View My Orders"
            style="secondary"
            href="/ChefOrdersScreen"
          />
        )}
      </View>

      {/* Event Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
              {selected ? selected.title : 'Booking'}
            </Text>
            {selected && (
              <Text style={{ color: '#374151' }}>
                {selected.startDate.toLocaleString('en-US')} - {selected.endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {!!selected?.customer_id && (
              <Text style={{ marginTop: 6, color: '#4b5563' }}>Customer ID: {selected.customer_id}</Text>
            )}
            {!!selected?.chef_id && (
              <Text style={{ color: '#4b5563' }}>Chef ID: {selected.chef_id}</Text>
            )}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, marginTop: 12, minHeight: 80, textAlignVertical: 'top' }}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity onPress={saveNotes} style={{ backgroundColor: '#65a30d', padding: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelBooking} style={{ backgroundColor: '#ef4444', padding: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelected(null)} style={{ padding: 12, minWidth: 80, alignItems: 'center' }}>
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
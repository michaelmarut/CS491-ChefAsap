import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import getEnvVars from '../../config';
import Button from '../components/Button';

const START_HOUR = 6;
const END_HOUR = 23;
const STEP_MIN = 30;
const SLOT_HEIGHT = 40;
const PX_PER_MIN = SLOT_HEIGHT / STEP_MIN;

// sizing for wide day columns + fixed time column
const TIME_COL_WIDTH = 68;
const DAY_COLUMN_WIDTH = 100;
const HEADER_HEIGHT = 50;
const FOOTER_PADDING = 0;
const DATE_HEADER_TEXT_STYLE = { fontSize: 13, fontWeight: '600' };
const DEV_MOCK_BOOKINGS = false;

// Status visibility rules
const normalizeStatus = (s) => String(s || '').toLowerCase();
const CHEF_ALLOWED = new Set(['accepted', 'completed', 'confirm', 'confirmed']);
const CUSTOMER_ALLOWED = new Set(['pending', 'accepted', 'completed']);

// Safe fetch to avoid JSON parse errors on HTML/404
async function fetchJsonSafe(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getWeekStart(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  // Make Monday the first day of week
  const day = dt.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // move to Monday
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function buildWeekDays(baseDate) {
  const start = getWeekStart(baseDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function buildTimeSlotsForDay(day) {
  const slots = [];
  const start = new Date(day);
  start.setHours(START_HOUR, 0, 0, 0);
  const end = new Date(day);
  end.setHours(END_HOUR, 0, 0, 0);
  for (let t = new Date(start); t < end; t = new Date(t.getTime() + STEP_MIN * 60000)) {
    const slotStart = new Date(t);
    const slotEnd = new Date(t.getTime() + STEP_MIN * 60000);
    slots.push({ start: slotStart, end: slotEnd });
  }
  return slots;
}

function formatHourLabel(d) {
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
}

function parseLocalDateTime(ymd, hm) {
  // ymd: 'YYYY-MM-DD', hm: 'HH:MM'
  if (!ymd) return new Date(NaN);
  const [y, m, da] = ymd.split('-').map((x) => parseInt(x, 10));
  let hh = 0, mm = 0;
  if (hm && typeof hm === 'string') {
    const parts = hm.split(':').map((x) => parseInt(x, 10));
    hh = parts[0] || 0;
    mm = parts[1] || 0;
  }
  return new Date(y, (m || 1) - 1, da || 1, hh, mm, 0, 0);
}

// Helpers pad, formatYmd, formatTime, formatHeader
function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatYmd(d) {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}
function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function formatHeader(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function BookingsScreen() {
  const { apiUrl } = getEnvVars();
  const { token, userType, profileId } = useAuth();

  const BOOKING_API_PREFIX = `${apiUrl}/booking`;
  const ORDER_API_PREFIX = `${apiUrl}/api/orders`;

  const [baseDate, setBaseDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const weekDays = useMemo(() => buildWeekDays(baseDate), [baseDate]);

  // Customers: use range endpoint that includes duration_minutes
  const customerCalendarEndpoint = useMemo(() => {
    if (!token || !profileId || userType !== 'customer') return null;
    const start = formatYmd(weekDays[0]);
    const end = formatYmd(weekDays[6]);
    return `${BOOKING_API_PREFIX}/customer/${profileId}/calendar?start=${start}&end=${end}`;
  }, [BOOKING_API_PREFIX, token, userType, profileId, weekDays]);

  // Chefs: use orders endpoint
  const chefCalendarEndpoint = useMemo(() => {
    if (!token || !profileId || userType !== 'chef') return null;
    const start = formatYmd(weekDays[0]);
    const end = formatYmd(weekDays[6]);
    return `${BOOKING_API_PREFIX}/chef/${profileId}/calendar?start=${start}&end=${end}`;
  }, [BOOKING_API_PREFIX, token, userType, profileId, weekDays]);

  // Refresh trigger (footer action)
  const triggerRefresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (DEV_MOCK_BOOKINGS) {
        if (!cancelled) {
          setEvents(buildMockEvents(baseDate));
          setLoading(false);
        }
        return;
      }
      if (!token || !profileId) return;

      const weekStart = new Date(weekDays[0]); weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekDays[6]); weekEnd.setHours(23, 59, 59, 999);

      try {
        if (userType === 'chef' && chefCalendarEndpoint) {
          // Chef calendar: bookings with duration_minutes
          const payload = await fetchJsonSafe(chefCalendarEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const raw = Array.isArray(payload) ? payload : (payload?.data ?? []);
          const mapped = (raw || [])
            .map((b) => {
              const start = parseLocalDateTime(b.booking_date, b.booking_time);
              const dur = Number.isFinite(b?.duration_minutes) ? b.duration_minutes : 60;
              const end = new Date(start.getTime() + dur * 60000);
              const status = normalizeStatus(b.status || 'pending');
              return {
                id: b.booking_id ?? b.id,
                startDate: start,
                endDate: end,
                notes: b.special_notes ?? '',
                status,
                chef_id: b.chef_id,
                customer_id: b.customer_id,
                title: b.cuisine_type ? `${b.cuisine_type}${b.meal_type ? ` (${b.meal_type})` : ''}` : 'Booking',
              };
            })
            .filter((e) => e.startDate >= weekStart && e.startDate <= weekEnd)
            .filter((e) => CHEF_ALLOWED.has(e.status));
          if (!cancelled) setEvents(mapped);
          return;
        }

        if (userType === 'customer' && customerCalendarEndpoint) {
          // Customer calendar: bookings with duration_minutes
          const payload = await fetchJsonSafe(customerCalendarEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const raw = Array.isArray(payload) ? payload : (payload?.data ?? []);
          const mapped = (raw || [])
            .map((b) => {
              const start = parseLocalDateTime(b.booking_date, b.booking_time);
              const dur = Number.isFinite(b?.duration_minutes) ? b.duration_minutes : 60;
              const end = new Date(start.getTime() + dur * 60000);
              const status = normalizeStatus(b.status || 'pending');
              return {
                id: b.booking_id ?? b.id,
                startDate: start,
                endDate: end,
                notes: b.special_notes ?? '',
                status,
                chef_id: b.chef_id,
                customer_id: b.customer_id,
                title: b.cuisine_type ? `${b.cuisine_type}${b.meal_type ? ` (${b.meal_type})` : ''}` : 'Booking',
              };
            })
            .filter((e) => e.startDate >= weekStart && e.startDate <= weekEnd)
            .filter((e) => CUSTOMER_ALLOWED.has(e.status));
          if (!cancelled) setEvents(mapped);
          return;
        }

        if (!cancelled) setEvents([]);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, profileId, userType, customerCalendarEndpoint, chefCalendarEndpoint, baseDate, weekDays, refreshKey]);

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
    <View className='flex-1 bg-base-100 dark:bg-base-dark-100'>
      {/* Week controls */}
      <View className='bg-base-100 dark:bg-dark-100 flex-row items-center justify-between px-3 py-2 border-b border-[#e5e7eb] dark:border-gray-500'>
        <Text className="text-primary-400 dark:text-dark-400 text-lg font-bold">
          Week of {formatHeader(weekDays[0])}
        </Text>
        <View className='flex-row'>
          <Button
            onPress={onPrevWeek}
            title={'Prev'}
            style='secondary'
            customClasses='px-3 mr-1 pt-1 pb-1 mb-0'
            customTextClasses='text-sm'
          />
          <Button
            onPress={onToday}
            title={'Today'}
            customClasses='px-3 mr-1 pt-2 pb-2 mb-0'
            customTextClasses='text-md'
          />
          <Button
            onPress={onNextWeek}
            style='secondary'
            title={'Next'}
            customClasses='px-3 pt-1 pb-1 mb-0'
            customTextClasses='text-sm'
          />
        </View>
      </View>

      {/* Fixed day header that scrolls horizontally with the grid */}
      <View className='flex-row bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
        {/* Left spacer so header aligns with the grid (time column) */}
        <View
          style={{ width: TIME_COL_WIDTH, height: HEADER_HEIGHT }}
          className='border-r-2 border-gray-200 dark:border-gray-700'
        />
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
            <View style={{ height: HEADER_HEIGHT }} className='flex-row bg-white dark:bg-gray-800'>
              {weekDays.map((d, i) => (
                <View
                  key={i}
                  style={{ width: DAY_COLUMN_WIDTH }}
                  className={`items-center justify-center border-gray-200 dark:border-gray-700 ${i === 0 ? '' : 'border-l'}`}
                >
                  <Text style={DATE_HEADER_TEXT_STYLE} className="text-primary-400 dark:text-dark-400">{formatHeader(d)} </Text>
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
        <View className='flex-row'>
          {/* LEFT: fixed time column */}
          <View
            style={{ width: TIME_COL_WIDTH }}
            className='border-r-2 border-gray-200 dark:border-gray-700'
          >
            {/* Time grid background + hour labels aligned to hour lines */}
            {(() => {
              const timeSlots = buildTimeSlotsForDay(weekDays[0]);
              const gridHeight = timeSlots.length * SLOT_HEIGHT;

              return (
                <View style={{ position: 'relative', height: gridHeight }} className='bg-white dark:bg-gray-800'>
                  {/* Background: hour lines */}
                  {timeSlots.map((slot, idx) => {
                    const isHour = slot.start.getMinutes() === 0;
                    return (
                      <View
                        key={idx}
                        style={{ height: SLOT_HEIGHT }}
                        className={`bg-white dark:bg-gray-800 ${isHour ? 'border-t-2' : ''} border-t-gray-200 dark:border-t-gray-700`}
                      />
                    );
                  })}

                  {/* Hour labels overlay on the hour lines */}
                  <View style={{ position: 'absolute', top: 8, left: 0, right: 0, height: gridHeight, pointerEvents: 'none' }}>
                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
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
                            fontSize: 13,
                            fontWeight: '600',
                            textAlign: 'right',
                          }}
                          className="text-primary-400 dark:text-dark-400"
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

              {/* Grid: background + events overlay */}
              <View className='flex-row'>
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
                      style={{ width: DAY_COLUMN_WIDTH, position: 'relative' }}
                      className={`border-gray-200 dark:border-gray-700 ${dayIdx === 0 ? '' : 'border-l'}`}
                    >
                      {/* Background grid (hour line on top, thin half-hour line) */}
                      {daySlots.map((slot, sIdx) => {
                        const isHour = slot.start.getMinutes() === 0;
                        return (
                          <View
                            key={sIdx}
                            style={{ height: SLOT_HEIGHT }}
                            className={`border-b border-gray-100 dark:border-gray-900 ${isHour ? 'border-t-2 border-t-gray-200 dark:border-t-gray-700 bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} `}
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
                            status === 'cancelled' ? 'bg-red-100 dark:bg-red-900' :
                              status === 'completed' ? 'bg-green-100 dark:bg-green-900' : 
                                'bg-primary-400 dark:bg-primary-300';
                          const border =
                            status === 'cancelled' ? 'border-red-500 dark:border-red-400' : 
                              status === 'completed' ? 'border-green-600 dark:border-green-400' :
                                'border-blue-500 dark:border-blue-400';

                          return (
                            <TouchableOpacity
                              key={evt.id || `${start.getTime()}-${end.getTime()}`}
                              onPress={() => openEvent(evt)}
                              activeOpacity={0.8}
                              style={{
                                position: 'absolute',
                                top,
                                height,
                              }}
                              className={`left-1 right-1 ${bg} border-l-3 ${border} rounded-lg px-2 py-1 overflow-hidden`}
                            >
                              <Text className='text-primary-100 dark:text-primary-100 text-xs font-semibold'>
                                {formatTime(clippedStart)}–{formatTime(clippedEnd)} {evt.title || 'Booking'}
                              </Text>
                              {!!evt.notes && (
                                <Text numberOfLines={1} className='text-primary-100 dark:text-primary-100 text-xs mt-0.5'>
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

      {/* Footer actions */}
      <View className="bg-base-100 dark:bg-dark-100 p-3 border-t border-gray-200 dark:border-gray-700 gap-2">
        <Button
          title={loading ? 'Refreshing…' : 'Refresh'}
          style="primary"
          onPress={triggerRefresh}
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

      {/* Event details modal (read-only) */}
      <Modal
        visible={!!selected}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelected(null)}
      >
        <View
          className='flex-1 justify-center items-center'
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          {/* Backdrop: tap anywhere outside the card to close */}
          <Pressable
            onPress={() => setSelected(null)}
            className='absolute inset-0'
          />

          <View
            className='w-[90%] max-w-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg'
            style={{ elevation: 4 }}
          >
            {/* Header: close button + title */}
            <View
              className='p-4 pb-0 border-b border-gray-200 dark:border-gray-700 relative'
            >
              <TouchableOpacity
                onPress={() => setSelected(null)}
                className='absolute top-3 right-3 p-2 z-10'
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text className='text-gray-900 dark:text-white text-lg'>✕</Text>
              </TouchableOpacity>

              <Text className='text-gray-900 dark:text-white text-lg font-semibold'>
                {selected?.title || 'Booking'}
              </Text>
            </View>

            {/* Body: read-only details */}
            <View className='p-4 gap-2'>
              {selected?.status && (
                <Text className='text-gray-700 dark:text-gray-300 text-sm'>
                  Status: {String(selected.status).charAt(0).toUpperCase() + String(selected.status).slice(1)}
                </Text>
              )}
              {selected?.startDate && (
                <Text className='text-gray-700 dark:text-gray-300 text-sm'>
                  Date: {formatHeader(new Date(selected.startDate))}
                </Text>
              )}
              {(selected?.startDate && selected?.endDate) && (
                <Text className='text-gray-700 dark:text-gray-300 text-sm'>
                  Time: {formatTime(new Date(selected.startDate))} – {formatTime(new Date(selected.endDate))}
                </Text>
              )}
              {(selected?.startDate && selected?.endDate) && (
                <Text className='text-gray-700 dark:text-gray-300 text-sm'>
                  Duration: {Math.max(1, Math.round((new Date(selected.endDate) - new Date(selected.startDate)) / 60000))} min
                </Text>
              )}
              {!!selected?.notes && (
                <Text className='text-gray-700 dark:text-gray-300 text-sm mt-2'>
                  Notes: {selected.notes}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
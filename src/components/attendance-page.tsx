
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const C = {
  bg: '#031B16',
  card: '#06251E',
  tile: '#102C27',
  border: '#185243',
  white: '#F6FBF8',
  muted: '#A6B8B1',
  green: '#00D995',
  blue: '#48A9FF',
  red: '#FF5669',
};

type Status = 'Attending' | 'Maybe' | 'Not Attending';
type Sort = 'Name A-Z' | 'Rating High-Low' | 'Rating Low-High';

type Player = {
  id: string;
  name: string;
  rating: number;
  level: string;
  status: Status;
  image: number;
};

const INITIAL: Player[] = [
  { id: 'you', name: 'Alex Tan', rating: 3.4, level: 'Intermediate', status: 'Attending', image: 12 },
  { id: 'priya', name: 'Priya Sharma', rating: 4.2, level: 'Advanced', status: 'Attending', image: 47 },
  { id: 'james', name: 'James Lee', rating: 3.8, level: 'Intermediate', status: 'Attending', image: 16 },
  { id: 'emily', name: 'Emily Wong', rating: 3.1, level: 'Beginner', status: 'Attending', image: 44 },
  { id: 'daniel', name: 'Daniel Kim', rating: 3.3, level: 'Intermediate', status: 'Attending', image: 11 },
  { id: 'sarah', name: 'Sarah Lim', rating: 2.9, level: 'Beginner', status: 'Attending', image: 45 },
  { id: 'mark', name: 'Mark Chen', rating: 3.2, level: 'Intermediate', status: 'Attending', image: 13 },
  { id: 'rachel', name: 'Rachel Kim', rating: 3.6, level: 'Intermediate', status: 'Attending', image: 48 },
  { id: 'tom', name: 'Tom Wilson', rating: 3.5, level: 'Intermediate', status: 'Attending', image: 15 },
  { id: 'laura', name: 'Laura Smith', rating: 3.7, level: 'Intermediate', status: 'Attending', image: 49 },
  { id: 'hannah', name: 'Hannah Lee', rating: 3.9, level: 'Advanced', status: 'Attending', image: 46 },
  { id: 'chris', name: 'Chris Brown', rating: 3.0, level: 'Beginner', status: 'Attending', image: 14 },
  { id: 'oliver', name: 'Oliver Green', rating: 4.0, level: 'Advanced', status: 'Attending', image: 17 },
  { id: 'mia', name: 'Mia Davis', rating: 3.5, level: 'Intermediate', status: 'Attending', image: 43 },
  { id: 'ben', name: 'Ben Harris', rating: 3.2, level: 'Intermediate', status: 'Maybe', image: 18 },
  { id: 'grace', name: 'Grace Liu', rating: 3.8, level: 'Intermediate', status: 'Maybe', image: 41 },
  { id: 'sam', name: 'Sam Parker', rating: 2.8, level: 'Beginner', status: 'Maybe', image: 19 },
  { id: 'lucy', name: 'Lucy Moore', rating: 3.4, level: 'Intermediate', status: 'Not Attending', image: 42 },
  { id: 'jack', name: 'Jack Turner', rating: 3.6, level: 'Intermediate', status: 'Not Attending', image: 20 },
];

const STATUSES: Status[] = [
  'Attending',
  'Maybe',
  'Not Attending',
];

const SORTS: Sort[] = [
  'Name A-Z',
  'Rating High-Low',
  'Rating Low-High',
];

const ICONS = {
  Attending: 'checkmark-circle',
  Maybe: 'help-circle-outline',
  'Not Attending': 'close-circle',
} as const;

const COLORS = {
  Attending: C.green,
  Maybe: C.blue,
  'Not Attending': C.red,
};

function dateKey(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function dateText(d: Date) {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const [records, setRecords] = useState<Record<string, Player[]>>({});
  const [filter, setFilter] = useState<Status>('Attending');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('Name A-Z');
  const [sortOpen, setSortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const key = dateKey(selectedDate);
  const players = records[key] ?? INITIAL;

  const ownStatus =
    players.find(p => p.id === 'you')?.status ?? 'Attending';

  const counts = useMemo(() => ({
    Attending: players.filter(p => p.status === 'Attending').length,
    Maybe: players.filter(p => p.status === 'Maybe').length,
    'Not Attending': players.filter(p => p.status === 'Not Attending').length,
  }), [players]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return players
      .filter(p =>
        p.status === filter &&
        p.name.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        if (sort === 'Rating High-Low') return b.rating - a.rating;
        if (sort === 'Rating Low-High') return a.rating - b.rating;
        return a.name.localeCompare(b.name);
      });
  }, [players, filter, search, sort]);

  const days = Array.from(
    { length: 5 },
    (_, i) => addDays(selectedDate, i - 2)
  );

  function changeStatus(status: Status) {
    setRecords(previous => {
      const current = previous[key] ?? INITIAL;

      return {
        ...previous,
        [key]: current.map(player =>
          player.id === 'you'
            ? { ...player, status }
            : player
        ),
      };
    });

    setStatusOpen(false);
  }

  return (
    <View style={s.root}>
      <View style={s.dateBar}>
        <Pressable
          onPress={() => setSelectedDate(d => addDays(d, -5))}
          style={s.dateArrow}
        >
          <Ionicons name="chevron-back" size={22} color={C.white} />
        </Pressable>

        {days.map(date => {
          const active = dateKey(date) === key;

          return (
            <Pressable
              key={dateKey(date)}
              onPress={() => setSelectedDate(date)}
              style={[s.dateItem, active && s.dateActive]}
            >
              <Text style={s.dateDay}>
                {date.toLocaleDateString('en-GB', {
                  weekday: 'short',
                })}
              </Text>

              <Text style={s.dateNumber}>{dateText(date)}</Text>

              {active && <View style={s.dateDot} />}
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setSelectedDate(d => addDays(d, 5))}
          style={s.dateArrow}
        >
          <Ionicons name="chevron-forward" size={22} color={C.white} />
        </Pressable>
      </View>

      <View style={s.session}>
        <View style={s.sessionIcon}>
          <Ionicons name="calendar" size={25} color={C.white} />
        </View>

        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.sessionTitle}>Club Night</Text>
          <Text style={s.sessionMeta}>19:00 – 21:00 · 4 Courts</Text>

          <View style={s.locationRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={C.muted}
            />
            <Text style={s.location}>Riverside Sports Centre</Text>
          </View>
        </View>
      </View>

      <View style={s.stats}>
        {([
          {
            label: 'Attending',
            count: counts.Attending,
            icon: 'people-outline',
            color: C.green,
          },
          {
            label: 'Maybe',
            count: counts.Maybe,
            icon: 'help-circle-outline',
            color: C.blue,
          },
          {
            label: 'Not Attending',
            count: counts['Not Attending'],
            icon: 'close-circle-outline',
            color: C.red,
          },
          {
            label: 'Total',
            count: players.length,
            icon: 'people-outline',
            color: C.white,
          },
        ] as const).map(stat => (
          <View key={stat.label} style={s.stat}>
            <Ionicons
              name={stat.icon}
              size={22}
              color={stat.color}
            />
            <Text style={s.statNumber}>{stat.count}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={s.myAttendance}
        onPress={() => setStatusOpen(true)}
      >
        <View>
          <Text style={s.eyebrow}>YOUR ATTENDANCE</Text>
          <Text style={s.myStatus}>{ownStatus}</Text>
        </View>

        <View style={s.changeRow}>
          <Text style={s.changeText}>Change</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={C.green}
          />
        </View>
      </Pressable>

      <View style={s.filters}>
        {STATUSES.map(status => (
          <Pressable
            key={status}
            onPress={() => setFilter(status)}
            style={[
              s.filterButton,
              filter === status && s.filterActive,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                s.filterText,
                filter === status && s.filterTextActive,
              ]}
            >
              {status} ({counts[status]})
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={19} color={C.muted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search players..."
            placeholderTextColor={C.muted}
            style={s.searchInput}
            autoCorrect={false}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={C.muted}
              />
            </Pressable>
          )}
        </View>

        <Pressable
          style={s.sortButton}
          onPress={() => setSortOpen(value => !value)}
        >
          <Text style={s.sortText} numberOfLines={1}>
            {sort}
          </Text>
          <Ionicons
            name="chevron-down"
            size={15}
            color={C.white}
          />
        </Pressable>
      </View>

      {sortOpen && (
        <View style={s.sortMenu}>
          {SORTS.map(option => (
            <Pressable
              key={option}
              style={s.sortOption}
              onPress={() => {
                setSort(option);
                setSortOpen(false);
              }}
            >
              <Text style={s.sortOptionText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={s.playerList}>
        {filtered.map(player => (
          <View key={player.id} style={s.playerRow}>
            <Image
              source={{
                uri: `https://i.pravatar.cc/150?img=${player.image}`,
              }}
              style={s.avatar}
            />

            <View style={s.identity}>
              <Text style={s.playerName} numberOfLines={1}>
                {player.name}
                {player.id === 'you' ? ' (You)' : ''}
              </Text>
            </View>

            <View style={s.rating}>
              <Text style={s.ratingText}>
                {player.rating.toFixed(1)}
              </Text>
            </View>

            <Text style={s.level} numberOfLines={1}>
              {player.level}
            </Text>

            <View style={s.playerStatus}>
              <Ionicons
                name={ICONS[player.status]}
                size={16}
                color={COLORS[player.status]}
              />
              <Text style={s.playerStatusText} numberOfLines={1}>
                {player.status}
              </Text>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No matching players.</Text>
          </View>
        )}
      </View>

      <Text style={s.demoNote}>
        DEMONSTRATION DATA · ATTENDANCE CHANGES ARE LOCAL ONLY
      </Text>

      <Modal
        visible={statusOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusOpen(false)}
      >
        <View style={s.modalShade}>
          <View style={s.modalPanel}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Your Attendance</Text>

              <Pressable onPress={() => setStatusOpen(false)}>
                <Ionicons name="close" size={24} color={C.white} />
              </Pressable>
            </View>

            <Text style={s.modalSubtitle}>
              Choose your status for {dateText(selectedDate)}.
            </Text>

            {STATUSES.map(status => (
              <Pressable
                key={status}
                style={s.modalChoice}
                onPress={() => changeStatus(status)}
              >
                <Ionicons
                  name={ICONS[status]}
                  size={23}
                  color={COLORS[status]}
                />

                <Text style={s.modalChoiceText}>{status}</Text>

                {ownStatus === status && (
                  <Ionicons
                    name="checkmark"
                    size={21}
                    color={C.green}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 12 },

  dateBar: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 4,
    gap: 3,
    minHeight: 68,
  },
  dateArrow: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateActive: { backgroundColor: '#008E61' },
  dateDay: { color: C.white, fontSize: 12 },
  dateNumber: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
  },
  dateDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.white,
  },

  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 13,
  },
  sessionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#005E48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
  },
  sessionMeta: { color: C.muted, fontSize: 13 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  location: { color: C.white, fontSize: 12 },

  stats: { flexDirection: 'row', gap: 6 },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 2,
    backgroundColor: C.tile,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
  },
  statNumber: {
    color: C.white,
    fontSize: 23,
    fontWeight: '800',
  },
  statLabel: {
    color: C.white,
    fontSize: 10,
    textAlign: 'center',
  },

  myAttendance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyebrow: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  myStatus: {
    color: C.green,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    color: C.green,
    fontSize: 13,
    fontWeight: '700',
  },

  filters: {
    flexDirection: 'row',
    backgroundColor: C.tile,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 3,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 9,
  },
  filterActive: { backgroundColor: '#008E61' },
  filterText: {
    color: C.white,
    fontSize: 11,
    textAlign: 'center',
  },
  filterTextActive: { fontWeight: '800' },

  searchRow: { flexDirection: 'row', gap: 8 },
  searchBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: C.tile,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 43,
  },
  searchInput: {
    flex: 1,
    color: C.white,
    fontSize: 13,
    paddingVertical: 8,
  },
  sortButton: {
    width: 132,
    backgroundColor: C.tile,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortText: {
    flex: 1,
    color: C.white,
    fontSize: 11,
  },
  sortMenu: {
    backgroundColor: C.tile,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sortOption: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  sortOptionText: { color: C.white, fontSize: 13 },

  playerList: { gap: 3 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingHorizontal: 7,
    paddingVertical: 6,
    minHeight: 56,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#D9E6E1',
  },
  identity: { flex: 1, minWidth: 0 },
  playerName: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  rating: {
    backgroundColor: '#07533F',
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  level: {
    width: 69,
    color: C.white,
    fontSize: 10,
  },
  playerStatus: {
    width: 91,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#07533F',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  playerStatusText: {
    flex: 1,
    color: C.white,
    fontSize: 9,
    fontWeight: '600',
  },
  empty: { padding: 25, alignItems: 'center' },
  emptyText: { color: C.muted },
  demoNote: {
    color: '#739A8B',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 8,
  },

  modalShade: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.76)',
    justifyContent: 'center',
    padding: 20,
  },
  modalPanel: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: '800',
  },
  modalSubtitle: { color: C.muted, fontSize: 13 },
  modalChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.tile,
    borderRadius: 11,
    padding: 14,
  },
  modalChoiceText: {
    flex: 1,
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

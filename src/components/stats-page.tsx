
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import Svg, {
    Circle,
    Defs,
    Line,
    Path,
    Rect,
    Stop,
    LinearGradient as SvgLinearGradient,
    Text as SvgText,
} from 'react-native-svg';

const C = {
  bg: '#031B16',
  card: '#05251E',
  tile: '#092D26',
  border: '#12483D',
  white: '#F6FBF8',
  muted: '#A6B8B1',
  mint: '#78DCC0',
  green: '#00D995',
  purple: '#8250D5',
  blue: '#48A9FF',
  orange: '#FF9B3F',
  red: '#FF5669',
};

const HERO = require('../../assets/images/shuttleheader.png');

type Category =
  | 'Overview'
  | 'Matches'
  | 'Partners'
  | 'Opponents'
  | 'Courts';

type Season = 'This Season' | 'Last Season' | 'All Time';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Person = {
  name: string;
  matches: number;
  rate: number;
  image: number;
  partnerImage?: number;
};

const PARTNERS: Person[] = [
  { name: 'Priya Sharma', matches: 12, rate: 67, image: 47 },
  { name: 'James Lee', matches: 8, rate: 50, image: 12 },
  { name: 'Emily Wong', matches: 6, rate: 67, image: 44 },
  { name: 'Daniel Kim', matches: 6, rate: 50, image: 11 },
  { name: 'Sarah Lim', matches: 5, rate: 60, image: 45 },
];

const OPPONENTS: Person[] = [
  {
    name: 'Mark & Daniel',
    matches: 14,
    rate: 43,
    image: 13,
    partnerImage: 11,
  },
  {
    name: 'Tom & Laura',
    matches: 8,
    rate: 63,
    image: 15,
    partnerImage: 47,
  },
  {
    name: 'Chris & Kevin',
    matches: 6,
    rate: 50,
    image: 44,
    partnerImage: 12,
  },
  {
    name: 'Nina & Ben',
    matches: 5,
    rate: 40,
    image: 48,
    partnerImage: 14,
  },
  {
    name: 'Ryan & Olivia',
    matches: 5,
    rate: 60,
    image: 17,
    partnerImage: 45,
  },
];

const CATEGORIES: Category[] = [
  'Overview',
  'Matches',
  'Partners',
  'Opponents',
  'Courts',
];

const SEASONS: Season[] = [
  'This Season',
  'Last Season',
  'All Time',
];

const SEASON_DATA = {
  'This Season': {
    matches: 24,
    winRate: 58,
    points: 5.2,
    hours: 12,
    wins: 14,
    losses: 10,
    trend: [38, 49, 49, 59, 76, 59, 76, 65],
    pointTrend: [2.5, 5.1, 5.3, 4.8, 7.8, 8.0, 10.1],
  },
  'Last Season': {
    matches: 18,
    winRate: 50,
    points: 4.8,
    hours: 9,
    wins: 9,
    losses: 9,
    trend: [30, 42, 38, 52, 45, 57, 50, 50],
    pointTrend: [2.8, 3.4, 4.0, 4.7, 4.4, 5.1, 6.0],
  },
  'All Time': {
    matches: 42,
    winRate: 55,
    points: 5.0,
    hours: 21,
    wins: 23,
    losses: 19,
    trend: [35, 43, 46, 51, 60, 55, 64, 55],
    pointTrend: [2.7, 4.1, 4.6, 5.0, 5.4, 6.4, 7.8],
  },
};

function Avatar({
  image,
  size = 30,
}: {
  image: number;
  size?: number;
}) {
  return (
    <Image
      source={{
        uri: `https://i.pravatar.cc/150?img=${image}`,
      }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: '#DCE8E3',
        backgroundColor: C.tile,
      }}
    />
  );
}

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: IconName;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={s.statTile}>
      <Ionicons name={icon} size={22} color={color} />

      <Text
        style={s.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {value}
      </Text>

      <Text
        style={s.statLabel}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </View>
  );
}

function Panel({
  title,
  right,
  children,
  style,
  compactTitle = false,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: object;
  compactTitle?: boolean;
}) {
  return (
    <View style={[s.panel, style]}>
      <View style={s.panelHeading}>
        <Text
          style={[
            s.panelTitle,
            compactTitle && s.compactPanelTitle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {title}
        </Text>

        {right ? (
          <View style={s.panelRight}>{right}</View>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function LineChart({
  values,
  max,
  percentage = false,
  id,
}: {
  values: number[];
  max: number;
  percentage?: boolean;
  id: string;
}) {
  const width = 300;
  const height = 118;

  const left = percentage ? 42 : 29;
  const right = 14;
  const top = 9;

  const plotWidth = width - left - right;
  const plotHeight = 82;
  const bottom = top + plotHeight;

  const points = values.map((value, index) => ({
    x: left + (index * plotWidth) / (values.length - 1),
    y: top + plotHeight * (1 - value / max),
  }));

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
    )
    .join(' ');

  const area =
    `${line} ` +
    `L ${points[points.length - 1].x} ${bottom} ` +
    `L ${points[0].x} ${bottom} Z`;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <Defs>
        <SvgLinearGradient
          id={id}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <Stop
            offset="0"
            stopColor={C.green}
            stopOpacity={0.25}
          />
          <Stop
            offset="1"
            stopColor={C.green}
            stopOpacity={0.01}
          />
        </SvgLinearGradient>
      </Defs>

      {[0, 0.5, 1].map((ratio, index) => {
        const y = top + ratio * plotHeight;

        return (
          <Line
            key={index}
            x1={left}
            x2={left + plotWidth}
            y1={y}
            y2={y}
            stroke="#1B4B3E"
            strokeWidth={0.7}
          />
        );
      })}

      {Array.from({ length: 8 }, (_, index) => {
        const x = left + (index * plotWidth) / 7;

        return (
          <Line
            key={index}
            x1={x}
            x2={x}
            y1={top}
            y2={bottom}
            stroke="#174236"
            strokeWidth={0.65}
          />
        );
      })}

      <Path d={area} fill={`url(#${id})`} />

      <Path
        d={line}
        stroke={C.green}
        strokeWidth={2.1}
        fill="none"
      />

      {points.map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={C.green}
          stroke={C.white}
          strokeWidth={1.2}
        />
      ))}

      {[
        {
          label: percentage ? '100%' : '10',
          y: top + 4,
        },
        {
          label: percentage ? '50%' : '5',
          y: top + plotHeight / 2 + 4,
        },
        {
          label: percentage ? '0%' : '0',
          y: bottom + 4,
        },
      ].map(item => (
        <SvgText
          key={item.label}
          x={2}
          y={item.y}
          fill={C.white}
          fontSize={10}
        >
          {item.label}
        </SvgText>
      ))}

      {['Jan', 'Feb', 'Mar', 'Apr'].map((month, index) => {
        const x = left + index * (plotWidth / 3);

        return (
          <SvgText
            key={month}
            x={x}
            y={112}
            fill={C.white}
            fontSize={10}
            textAnchor={
              index === 0
                ? 'start'
                : index === 3
                  ? 'end'
                  : 'middle'
            }
          >
            {month}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function DonutChart() {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  const parts = [
    { value: 62, color: C.purple },
    { value: 28, color: '#00C78B' },
    { value: 10, color: C.orange },
  ];

  let offset = 0;

  return (
    <View style={s.donutRow}>
      <View style={s.donutContainer}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 110 110"
        >
          {parts.map(part => {
            const currentOffset = offset;
            offset += part.value;

            return (
              <Circle
                key={part.color}
                cx={55}
                cy={55}
                r={radius}
                fill="none"
                stroke={part.color}
                strokeWidth={22}
                strokeDasharray={
                  `${(part.value / 100) * circumference} ${circumference}`
                }
                strokeDashoffset={
                  -(currentOffset / 100) * circumference
                }
                rotation={-90}
                origin="55,55"
              />
            );
          })}
        </Svg>
      </View>

      <View style={s.legend}>
        {[
          {
            label: 'Doubles',
            value: '62%',
            color: C.purple,
          },
          {
            label: 'Singles',
            value: '28%',
            color: '#00C78B',
          },
          {
            label: 'Mixed',
            value: '10%',
            color: C.orange,
          },
        ].map(item => (
          <View key={item.label} style={s.legendRow}>
            <View
              style={[
                s.legendDot,
                { backgroundColor: item.color },
              ]}
            />

            <Text
              style={s.legendLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {item.label}
            </Text>

            <Text
              style={s.legendValue}
              numberOfLines={1}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ResultsChart() {
  const bars = [
    { value: 8, win: true },
    { value: 5, win: false },
    { value: 3.5, win: true },
    { value: 4.2, win: false },
    { value: 8, win: true },
    { value: 5.8, win: true },
    { value: 4.2, win: false },
  ];

  return (
    <View style={s.resultsBody}>
      <View style={s.resultsGraph}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 260 100"
          preserveAspectRatio="none"
        >
          {[0, 0.5, 1].map((ratio, index) => {
            const y = 8 + ratio * 78;

            return (
              <Line
                key={index}
                x1={24}
                x2={257}
                y1={y}
                y2={y}
                stroke="#1B4B3E"
                strokeWidth={0.7}
              />
            );
          })}

          {[10, 5, 0].map((number, index) => (
            <SvgText
              key={number}
              x={2}
              y={12 + index * 39}
              fill={C.white}
              fontSize={10}
            >
              {number}
            </SvgText>
          ))}

          {bars.map((bar, index) => {
            const x = 33 + index * 32;
            const barHeight = bar.value * 7.8;

            return (
              <Rect
                key={index}
                x={x}
                y={86 - barHeight}
                width={18}
                height={barHeight}
                rx={2}
                fill={bar.win ? C.green : C.red}
              />
            );
          })}
        </Svg>
      </View>

      <View style={s.resultsLegend}>
        <View style={s.resultLegendItem}>
          <View
            style={[
              s.resultDot,
              { backgroundColor: C.green },
            ]}
          />
          <Text style={s.resultLegendText}>Wins (7)</Text>
        </View>

        <View style={s.resultLegendItem}>
          <View
            style={[
              s.resultDot,
              { backgroundColor: C.red },
            ]}
          />
          <Text style={s.resultLegendText}>Losses (3)</Text>
        </View>
      </View>
    </View>
  );
}

function RankingList({
  people,
  kind,
  compact,
}: {
  people: Person[];
  kind: 'Partners' | 'Opponents';
  compact: boolean;
}) {
  return (
    <View style={s.rankingList}>
      {people.map((person, index) => (
        <View key={person.name} style={s.rankingRow}>
          <Text style={s.rankNumber}>{index + 1}</Text>

          <View
            style={[
              s.avatarGroup,
              !compact && { width: 41 },
            ]}
          >
            <Avatar image={person.image} size={29} />

            {person.partnerImage !== undefined && (
              <View style={s.overlapAvatar}>
                <Avatar
                  image={person.partnerImage}
                  size={29}
                />
              </View>
            )}
          </View>

          <View style={s.rankInfo}>
            <Text
              style={s.rankName}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {person.name}
            </Text>

            <Text
              style={s.rankSub}
              numberOfLines={1}
            >
              {person.matches} matches
            </Text>
          </View>

          <View
            style={[
              s.rankProgress,
              compact && { width: 39 },
            ]}
          >
            <Text style={s.rankPercent}>
              {person.rate}%
            </Text>

            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${person.rate}%`,
                    backgroundColor:
                      kind === 'Opponents' &&
                      person.rate < 50
                        ? C.red
                        : C.green,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function CourtPerformance() {
  const courts = [
    { court: 1, matches: 8, wins: 5, rate: 63 },
    { court: 2, matches: 7, wins: 4, rate: 57 },
    { court: 3, matches: 5, wins: 3, rate: 60 },
    { court: 4, matches: 4, wins: 2, rate: 50 },
  ];

  return (
    <View style={s.courts}>
      {courts.map(item => (
        <View key={item.court} style={s.courtRow}>
          <View style={s.courtIcon}>
            <Ionicons
              name="grid-outline"
              size={20}
              color={C.green}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.courtTitle}>
              Court {item.court}
            </Text>

            <Text style={s.courtSubtitle}>
              {item.matches} matches · {item.wins} wins
            </Text>
          </View>

          <Text style={s.courtRate}>
            {item.rate}%
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsPage() {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const [season, setSeason] =
    useState<Season>('This Season');

  const [seasonOpen, setSeasonOpen] =
    useState(false);

  const [category, setCategory] =
    useState<Category>('Overview');

  const data = SEASON_DATA[season];

  const metricTiles: {
    icon: IconName;
    value: string;
    label: string;
    color: string;
  }[] = [
    {
      icon: 'tennisball-outline',
      value: String(data.matches),
      label: 'Matches',
      color: C.green,
    },
    {
      icon: 'trophy-outline',
      value: `${data.winRate}%`,
      label: 'Win Rate',
      color: C.green,
    },
    {
      icon: 'stats-chart-outline',
      value: data.points.toFixed(1),
      label: 'Avg. Points\nper Match',
      color: C.blue,
    },
    {
      icon: 'time-outline',
      value: String(data.hours),
      label: 'Hours Played',
      color: C.orange,
    },
  ];

  const showCharts =
    category === 'Overview' ||
    category === 'Matches';

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* HEADER */}

        <View style={s.hero}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={s.heroImage}
          />

          <View
            pointerEvents="none"
            style={s.heroTint}
          />

          <LinearGradient
            colors={[
              'rgba(3,27,22,0.48)',
              'rgba(3,27,22,0.12)',
              'rgba(3,27,22,0.18)',
              'rgba(3,27,22,0.58)',
              'rgba(3,27,22,0.88)',
              C.bg,
            ]}
            locations={[
              0,
              0.2,
              0.4,
              0.62,
              0.82,
              1,
            ]}
            style={s.heroOverlay}
          >
            <View style={s.brandRow}>
              <View style={s.brand}>
                <Text style={s.brandIcon}>🏸</Text>

                <View>
                  <Text style={s.brandText}>
                    Riverside
                  </Text>
                  <Text style={s.brandText}>
                    Badminton Club
                  </Text>
                </View>
              </View>

              <View style={s.brandRight}>
                <Pressable style={s.bell}>
                  <Ionicons
                    name="notifications-outline"
                    size={25}
                    color={C.white}
                  />
                  <View style={s.redDot} />
                </Pressable>

                <Avatar image={12} size={43} />
              </View>
            </View>

            <View style={s.titleBlock}>
              <Text style={s.heroTitle}>
                Stati
                <Text style={s.heroMint}>
                  stics
                </Text>
              </Text>

              <Text style={s.heroSubtitle}>
                Track your performance and club insights
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* CONTENT */}

        <View style={s.content}>
          {/* SEASON */}

          <View style={s.seasonArea}>
            <Pressable
              style={s.seasonButton}
              onPress={() =>
                setSeasonOpen(!seasonOpen)
              }
            >
              <Text style={s.seasonText}>
                {season}
              </Text>

              <Ionicons
                name={
                  seasonOpen
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={18}
                color={C.white}
              />
            </Pressable>

            {seasonOpen && (
              <View style={s.seasonMenu}>
                {SEASONS.map(option => (
                  <Pressable
                    key={option}
                    style={s.seasonOption}
                    onPress={() => {
                      setSeason(option);
                      setSeasonOpen(false);
                    }}
                  >
                    <Text style={s.seasonOptionText}>
                      {option}
                    </Text>

                    {season === option && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={C.green}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* METRIC CARDS */}

          <View style={s.statGrid}>
            {metricTiles.map(item => (
              <StatTile
                key={item.label}
                {...item}
              />
            ))}
          </View>

          {/* CATEGORY TABS */}

          <View style={s.tabs}>
            {CATEGORIES.map(item => (
              <Pressable
                key={item}
                onPress={() =>
                  setCategory(item)
                }
                style={[
                  s.tab,
                  category === item &&
                    s.activeTab,
                ]}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  style={[
                    s.tabText,
                    category === item &&
                      s.activeTabText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* CHARTS */}

          {showCharts && (
            <>
              {/* ROW 1 */}

              <View style={s.chartRow}>
                <View
                  style={[
                    s.chartColumn,
                    { flex: 1.55 },
                  ]}
                >
                  <Panel
                    title="Win Rate"
                    style={s.chartPanel}
                    right={
                      <Text
                        style={s.highlightValue}
                      >
                        {data.winRate}%
                      </Text>
                    }
                  >
                    <View style={s.winChart}>
                      <LineChart
                        values={data.trend}
                        max={100}
                        percentage
                        id="winRateFill"
                      />
                    </View>
                  </Panel>
                </View>

                <View
                  style={[
                    s.chartColumn,
                    { flex: 1 },
                  ]}
                >
                  <Panel
                    title="Match Types"
                    style={s.chartPanel}
                  >
                    <View style={s.donutFill}>
                      <DonutChart />
                    </View>
                  </Panel>
                </View>
              </View>

              {/* ROW 2 */}

              <View style={s.chartRow}>
                <View style={s.chartColumn}>
                  <Panel
                    title="Results"
                    style={s.chartPanel}
                    right={
                      <View
                        style={s.resultsFilter}
                      >
                        <Text
                          style={
                            s.resultsFilterText
                          }
                          numberOfLines={1}
                        >
                          Last 10 Matches
                        </Text>

                        <Ionicons
                          name="chevron-down"
                          size={12}
                          color={C.white}
                        />
                      </View>
                    }
                  >
                    <ResultsChart />
                  </Panel>
                </View>

                <View style={s.chartColumn}>
                  <Panel
                    title="Points per Match"
                    style={s.chartPanel}
                    compactTitle
                  >
                    <View
                      style={s.pointsHeading}
                    >
                      <Text
                        style={s.largeNumber}
                      >
                        {data.points.toFixed(1)}
                      </Text>

                      <Text
                        style={s.greenSmall}
                      >
                        ↑ 12%
                      </Text>
                    </View>

                    <View
                      style={s.pointsChart}
                    >
                      <LineChart
                        values={
                          data.pointTrend
                        }
                        max={11}
                        id="pointsFill"
                      />
                    </View>
                  </Panel>
                </View>
              </View>
            </>
          )}

          {/* RANKINGS */}

          {(category === 'Overview' ||
            category === 'Partners' ||
            category === 'Opponents') && (
            <View style={s.rankingColumns}>
              {(category === 'Overview' ||
                category === 'Partners') && (
                <View
                  style={s.rankingColumn}
                >
                  <Panel
                    title="Top Partners"
                    style={s.rankingPanel}
                    right={
                      <Pressable
                        onPress={() =>
                          setCategory(
                            'Partners',
                          )
                        }
                      >
                        <Text
                          style={s.viewAll}
                        >
                          View All ›
                        </Text>
                      </Pressable>
                    }
                  >
                    <RankingList
                      people={PARTNERS}
                      kind="Partners"
                      compact={compact}
                    />
                  </Panel>
                </View>
              )}

              {(category === 'Overview' ||
                category === 'Opponents') && (
                <View
                  style={s.rankingColumn}
                >
                  <Panel
                    title="Common Opponents"
                    compactTitle
                    style={s.rankingPanel}
                    right={
                      <Pressable
                        onPress={() =>
                          setCategory(
                            'Opponents',
                          )
                        }
                      >
                        <Text
                          style={s.viewAll}
                        >
                          View All ›
                        </Text>
                      </Pressable>
                    }
                  >
                    <RankingList
                      people={OPPONENTS}
                      kind="Opponents"
                      compact={compact}
                    />
                  </Panel>
                </View>
              )}
            </View>
          )}

          {/* COURTS */}

          {category === 'Courts' && (
            <Panel
              title="Performance by Court"
            >
              <CourtPerformance />
            </Panel>
          )}

          <Text style={s.demoNote}>
            DEMONSTRATION STATISTICS · NOT YET CONNECTED TO MATCH RESULTS
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    paddingBottom: 28,
  },

  /* HEADER */

  hero: {
    height: 210,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },

  heroImage: {
    position: 'absolute',
    width: '150%',
    height: '105%',
    right: -40,
    top: 1,
  },

  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(0,42,32,0.14)',
  },

  heroOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },

  brandRow: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  brandIcon: {
    fontSize: 29,
  },

  brandText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },

  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  bell: {
    padding: 4,
  },

  redDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },

  titleBlock: {
    paddingBottom: 28,
  },

  heroTitle: {
    color: C.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },

  heroMint: {
    color: C.mint,
  },

  heroSubtitle: {
    color: C.white,
    fontSize: 13,
    marginTop: 1,
  },

  /* CONTENT */

  content: {
    paddingHorizontal: 12,
    gap: 10,
    marginTop: -3,
  },

  seasonArea: {
    position: 'relative',
    zIndex: 10,
  },

  seasonButton: {
    width: 150,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  seasonText: {
    color: C.white,
    fontSize: 13,
  },

  seasonMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 160,
    backgroundColor: C.tile,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 8,
  },

  seasonOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  seasonOptionText: {
    color: C.white,
    fontSize: 13,
  },

  /* METRICS */

  statGrid: {
    flexDirection: 'row',
    gap: 6,
  },

  statTile: {
    flex: 1,
    minWidth: 0,
    height: 103,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 2,
  },

  statValue: {
    color: C.white,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 29,
  },

  statLabel: {
    color: C.white,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },

  /* TABS */

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0C2D27',
    borderRadius: 11,
    padding: 2,
    gap: 1,
  },

  tab: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  activeTab: {
    backgroundColor: '#00A978',
  },

  tabText: {
    color: C.white,
    fontSize: 10,
    fontWeight: '500',
  },

  activeTabText: {
    fontWeight: '700',
  },

  /* CHART CARDS */

  chartRow: {
    flexDirection: 'row',
    height: 180,
    gap: 7,
    alignItems: 'stretch',
  },

  chartColumn: {
    flex: 1,
    minWidth: 0,
  },

  panel: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 9,
    gap: 6,
  },

  chartPanel: {
    flex: 1,
    overflow: 'hidden',
  },

  panelHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    minHeight: 22,
  },

  panelTitle: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    flexShrink: 1,
  },

  compactPanelTitle: {
    fontSize: 11,
  },

  panelRight: {
    flexShrink: 0,
  },

  highlightValue: {
    color: C.green,
    fontSize: 19,
    fontWeight: '800',
  },

  /* WIN RATE */

  winChart: {
    flex: 1,
    minHeight: 0,
    paddingTop: 3,
    paddingBottom: 2,
  },

  /* DONUT */

  donutFill: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
  },

  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 2,
  },

  donutContainer: {
    width: '43%',
    aspectRatio: 1,
    flexShrink: 0,
  },

  legend: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },

  legendLabel: {
    color: C.white,
    fontSize: 9,
    flex: 1,
    minWidth: 0,
  },

  legendValue: {
    color: C.white,
    fontSize: 9,
    fontWeight: '700',
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },

  /* RESULTS */

  resultsFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.tile,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },

  resultsFilterText: {
    color: C.white,
    fontSize: 9,
  },

  resultsBody: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'flex-end',
    gap: 8,
    paddingBottom: 3,
  },

  resultsGraph: {
    flex: 1,
    minHeight: 0,
  },

  resultsLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },

  resultLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  resultDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  resultLegendText: {
    color: C.white,
    fontSize: 10,
  },

  /* POINTS PER MATCH */

  pointsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 30,
    flexShrink: 0,
  },

  largeNumber: {
    color: C.white,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 30,
    includeFontPadding: false,
  },

  greenSmall: {
    color: C.green,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },

  pointsChart: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },

  /* RANKINGS */

  rankingColumns: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'stretch',
  },

  rankingColumn: {
    flex: 1,
    minWidth: 0,
  },

  rankingPanel: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  viewAll: {
    color: C.green,
    fontSize: 9,
    fontWeight: '600',
    flexShrink: 0,
  },

  rankingList: {
    gap: 10,
    paddingTop: 2,
  },

  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
  },

  rankNumber: {
    color: C.white,
    fontSize: 11,
    width: 10,
    fontWeight: '700',
  },

  avatarGroup: {
    width: 38,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },

  overlapAvatar: {
    marginLeft: -17,
  },

  rankInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  rankName: {
    color: C.white,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  rankSub: {
    color: C.muted,
    fontSize: 9,
    lineHeight: 12,
  },

  rankProgress: {
    width: 45,
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },

  rankPercent: {
    color: C.white,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    backgroundColor: '#24463D',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* COURTS */

  courts: {
    gap: 10,
  },

  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  courtIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },

  courtTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },

  courtSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },

  courtRate: {
    color: C.green,
    fontSize: 19,
    fontWeight: '800',
  },

  demoNote: {
    color: '#739A8B',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});

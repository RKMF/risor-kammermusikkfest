import { Card, Text, Stack, Heading, Code, Box } from '@sanity/ui';
import {
  BlockContentIcon,
  TextIcon,
  AddCommentIcon,
  ImageIcon,
  PlayIcon,
  BoltIcon,
  TiersIcon,
  ClockIcon,
  DocumentIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
} from '@sanity/icons';

interface ComponentInfo {
  name: string;
  icon: React.ComponentType;
  useCase: string;
  when: string;
  example?: string;
}

const components: Record<string, ComponentInfo[]> = {
  Innhold: [
    {
      name: 'Overskrift',
      icon: BlockContentIcon,
      useCase: 'Lag en overskrift for å strukturere innholdet ditt',
      when: 'Bruk når du trenger å organisere innhold i seksjoner med tydelige overskrifter (H2-H4)',
      example: 'Programoversikt, Om festivalen, Praktisk info',
    },
    {
      name: 'Tekst',
      icon: TextIcon,
      useCase: 'Skriv formatert tekst med uthevinger, lenker og lister',
      when: 'For all løpende tekst som festivalinformasjon, beskrivelser, og artikler',
      example: 'Festivalbeskrivelser, reglement, praktisk informasjon',
    },
    {
      name: 'Sitat',
      icon: AddCommentIcon,
      useCase: 'Fremhev et viktig sitat eller uttalelse',
      when: 'For å trekke frem uttalelser fra artister, organisatører eller anmeldelser',
      example: '"En uforglemmelig opplevelse!" - VG',
    },
  ],
  Media: [
    {
      name: 'Bilde',
      icon: ImageIcon,
      useCase:
        'Last opp egne bilder, søk i Unsplash, eller velg fra bildebiblioteket. Inkluder alt-tekst, bildetekst og kreditering.',
      when: 'For alle typer bilder: festivalbilder, artistbilder, sceneveiledning. Velg format (kvadrat, portrett, stående, landskap) for best visning.',
      example: 'Festivalområde, scenebilder, artistfoto',
    },
    {
      name: 'Video',
      icon: PlayIcon,
      useCase: '4 måter å legge til video: Last opp fil, YouTube, Vimeo, eller direkte video-URL',
      when: 'For konsertopptak, aftermovies, festivalkonsepter eller artistintervjuer. Velg format (kvadrat, portrett, landskap) for best visning.',
      example: 'Fjorårets høydepunkter, festivalfilm, artistintervju',
    },
    {
      name: 'Spotify',
      icon: PlayIcon,
      useCase: 'Bygg inn Spotify-spillelister, album, låter eller artistprofiler',
      when: 'Del festivalspillelister, vis artistenes musikk, eller kurater stemningen',
      example: 'Festivalspilleliste 2025, featured artister, warm-up playlist',
    },
  ],
  Interaktiv: [
    {
      name: 'Knapp',
      icon: BoltIcon,
      useCase: 'Lag lenker som ser ut som knapper (3 stiler: primær, sekundær, outline)',
      when: 'For call-to-action som billettkjøp, påmelding, eller viktige lenker',
      example: 'Kjøp billetter, Meld deg på nyhetsbrev, Last ned festivalapp',
    },
    {
      name: 'Sammenleggbar seksjon (Accordion)',
      icon: TiersIcon,
      useCase: 'Organiser mye informasjon i sammenleggbare seksjoner',
      when: 'Perfekt for FAQ, detaljert praktisk info, eller lange lister',
      example: 'Ofte stilte spørsmål, Ankomst og parkering, Festivalregler',
    },
    {
      name: 'Nedtelling',
      icon: ClockIcon,
      useCase: 'Vis nedtelling til et arrangement',
      when: 'Skaper spenning og urgency før festivalen eller spesielle konserter',
      example: 'Nedtelling til festivalstart, neste konsert, billettslipp',
    },
  ],
  Layout: [
    {
      name: 'To kolonner',
      icon: TiersIcon,
      useCase: 'Vis to komponenter side ved side (tilpasser seg mobil)',
      when: 'For å vise to relaterte ting sammen, som bilde + tekst',
      example: 'Artistbilde ved siden av bio, kart + praktisk info',
    },
    {
      name: 'Tre kolonner',
      icon: TiersIcon,
      useCase: 'Vis tre komponenter side ved side (tilpasser seg mobil)',
      when: 'For å vise flere relaterte ting, trio av bilder eller stats',
      example: 'Tre hovedscener, samarbeidspartnere, festivaltall',
    },
    {
      name: 'Rutenett',
      icon: TiersIcon,
      useCase: 'Organiser bilder, videoer eller Spotify i et rutenett (alle kort er 4:5 format)',
      when: 'For visuell presentasjon av flere like elementer i et grid',
      example: 'Bildegalleri, video-highlights, featured playlists',
    },
  ],
  Seksjoner: [
    {
      name: 'Artistkarusell',
      icon: DocumentIcon,
      useCase: 'Horisontal scrollbar med artistkort (4:5 format)',
      when: 'For å vise line-up eller fremhevede artister på en elegant måte',
      example: 'Årets line-up, Headlinere, Spotlight artister',
    },
    {
      name: 'Arrangementkarusell',
      icon: CalendarIcon,
      useCase: 'Horisontal scrollbar med arrangementkort (4:5 format)',
      when: 'Vis kommende konserter, program eller festivalkalender',
      example: 'Dette skjer i dag, Helgens høydepunkter, Hele programmet',
    },
    {
      name: 'Innholdskarusell',
      icon: EllipsisHorizontalIcon,
      useCase:
        'Horisontal scrollbar med blandet innhold: bilder, video, Spotify, sitater (alle 4:5)',
      when: 'For storytelling med variert innhold i Instagram-stil',
      example: 'Festivalhøydepunkter, Stemningsbilder + musikk, Anmeldelser',
    },
  ],
};

export default function ComponentGuide() {
  return (
    <Box padding={4}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading size={3}>📚 Komponentveiledning</Heading>
          <Text muted size={1}>
            Oversikt over alle tilgjengelige komponenter og når du skal bruke dem
          </Text>
        </Stack>

        {Object.entries(components).map(([category, items]) => (
          <Stack key={category} space={4}>
            <Heading size={2}>{category}</Heading>
            <Stack space={3}>
              {items.map((component) => {
                const Icon = component.icon;
                return (
                  <Card key={component.name} padding={4} radius={2} shadow={1}>
                    <Stack space={3}>
                      <Stack space={2}>
                        <Box>
                          <Text size={2} weight="semibold">
                            <Icon style={{ display: 'inline', marginRight: 8 }} />
                            {component.name}
                          </Text>
                        </Box>
                        <Text size={1}>{component.useCase}</Text>
                      </Stack>

                      <Stack space={2}>
                        <Text size={1} weight="semibold" muted>
                          Når skal du bruke dette?
                        </Text>
                        <Text size={1} muted>
                          {component.when}
                        </Text>
                      </Stack>

                      {component.example && (
                        <Stack space={2}>
                          <Text size={1} weight="semibold" muted>
                            Eksempler
                          </Text>
                          <Code size={1}>{component.example}</Code>
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </Stack>
        ))}

        <Card padding={4} radius={2} tone="primary">
          <Stack space={2}>
            <Text weight="semibold">💡 Tips</Text>
            <Text size={1}>
              • Alle scroll-containere og rutenettkort bruker 4:5 format for konsistent design
              <br />
              • Bruk accordion for mye informasjon som må organiseres
              <br />
              • Video er konge - bruk det flittig for engasjement
              <br />• Kombiner komponenter for beste storytelling
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}

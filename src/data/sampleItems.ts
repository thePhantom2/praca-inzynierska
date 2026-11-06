export type SampleItem = {
  id: string;
  title: string;
  description: string;
};

export const sampleItems: SampleItem[] = [
  {
    id: '1',
    title: 'Element pierwszy',
    description: 'Przykładowy rekord listy. Podmień go na dane z Twojej pracy.',
  },
  {
    id: '2',
    title: 'Element drugi',
    description: 'Kolejny placeholder, który otwiera ekran szczegółów.',
  },
  {
    id: '3',
    title: 'Element trzeci',
    description: 'Szkielet aplikacji — gotowy do rozbudowy o logikę biznesową.',
  },
];

export function getSampleItem(id: string): SampleItem | undefined {
  return sampleItems.find((item) => item.id === id);
}

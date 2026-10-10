// Vitrin sayfasında katman kapalı. (Ayrı bir sayfa olması, vitrinin [...catchAll]
// yerine buraya düşüp statik/ISR kalmasını sağlar.)
export function generateStaticParams() {
  return [];
}

export default function Empty() {
  return null;
}

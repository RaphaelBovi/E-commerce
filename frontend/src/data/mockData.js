const imagePool = [
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1563223771696-6e541ceaf35a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1590650505527-4632ba5ebf75?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1610499092419-79848f0cb020?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1530268578403-df6e8ea36109?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1620054700010-85f269a9b40b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1580274455015-fa37fd10b651?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1581092147343-f66195e0cba0?auto=format&fit=crop&w=600&q=80",
];

function categoryForIndex(i) {
  if (i <= 12) return "mais-vendidos";
  if (i <= 24) return "novidades";
  return "geral";
}

export const products = Array.from({ length: 40 }, (_, idx) => {
  const i = idx + 1;
  return {
    id: i,
    name: `Produto ${i}`,
    ref: `REF-${String(i).padStart(3, "0")}`,
    price: Number((49.9 + ((i * 193) % 9500) + (i % 7) * 11).toFixed(2)),
    category: categoryForIndex(i),
    image: imagePool[idx % imagePool.length],
  };
});

import { productLook } from '../format'
import photos from '../product-photos.json'

export default function ProductImage({ slug, large = false }) {
  const look = productLook(slug)
  const photo = photos[slug]
  const columns = photo?.columns || 4
  if (photo) {
    return (
      <div className={`product-image product-photo${large ? ' product-image-large' : ''}`}
        aria-hidden="true"
        style={{
          backgroundImage: `url(/products/catalog-0${photo.sheet}.png)`,
          backgroundSize: `${columns * 100}% ${columns * 100}%`,
          backgroundPosition: `${(photo.tile % columns) * 100 / (columns - 1)}% ${Math.floor(photo.tile / columns) * 100 / (columns - 1)}%`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    )
  }
  return (
    <div className={`product-image tint-${look.tint}${large ? ' product-image-large' : ''}`} aria-hidden="true">
      <span>{look.icon}</span>
    </div>
  )
}

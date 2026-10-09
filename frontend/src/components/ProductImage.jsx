import { productLook } from '../format'

export default function ProductImage({ slug, large = false }) {
  const look = productLook(slug)
  return (
    <div className={`product-image tint-${look.tint}${large ? ' product-image-large' : ''}`} aria-hidden="true">
      <span>{look.icon}</span>
    </div>
  )
}

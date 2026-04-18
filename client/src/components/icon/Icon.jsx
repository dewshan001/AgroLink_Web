import "./icon.css"

export default function Icon() {
  const scrollToTop = () => {
    const supportsSmoothScroll = typeof window !== "undefined" && "scrollBehavior" in document.documentElement.style
    if (supportsSmoothScroll) window.scrollTo({ top: 0, behavior: "smooth" })
    else window.scrollTo(0, 0)
  }

  return (
    <button type="button" className="icon" onClick={scrollToTop} aria-label="Scroll to top">
      <i className="fas fa-chevron-up"></i>
    </button>
  )
}

// Global animation variants for consistency
export const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const fadeInLeft = {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const fadeInRight = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
};

// Viewport settings for scroll animations
export const viewportSettings = {
    once: true,
    margin: "-50px"
};

// Hover variants
export const hoverLift = {
    whileHover: {
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

export const hoverScale = {
    whileHover: {
        scale: 1.05,
        transition: { duration: 0.3, ease: "easeOut" }
    }
};

export const hoverGlow = {
    whileHover: {
        boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)",
        transition: { duration: 0.3 }
    }
};

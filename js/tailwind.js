tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            red: '#E52521',
                            blue: '#00539B',
                            teal: '#009688',
                        }
                    },
                    keyframes: {
                        fadeInUp: {
                            '0%': { opacity: '0', transform: 'translateY(12px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' }
                        },
                        popIn: {
                            '0%': { transform: 'scale(0.96)', opacity: '0.8' },
                            '100%': { transform: 'scale(1)', opacity: '1' }
                        }
                    },
                    animation: {
                        'fade-in-up': 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        'pop-in': 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }
                }
            }
        }
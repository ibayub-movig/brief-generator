import '@/styles/globals.css'
import { AppProps } from 'next/app'
import { Work_Sans, Outfit } from 'next/font/google'

const workSans = Work_Sans({ subsets: ['latin'] })
const outfit = Outfit({ subsets: ['latin'] })

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-work-sans: ${workSans.style.fontFamily};
          --font-outfit: ${outfit.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
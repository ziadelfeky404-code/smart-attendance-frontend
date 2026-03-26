import React from 'react'
import type { AppProps } from 'next/app'
import PublicLayout from '@/components/Layout/PublicLayout'
import { ReactElement, ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'

type NextPageWithLayout = AppProps & {
  Component: any
}

export default function App({ Component, pageProps }: NextPageWithLayout) {
  // Support per-page layout if provided, otherwise fall back to public layout
  const getLayout = (Component as any).getLayout || ((page: ReactElement) => <PublicLayout>{page}</PublicLayout>)
  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      <Analytics />
    </>
  )
}

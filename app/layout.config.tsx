import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import logo from '../public/logo.png'

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image
          src={logo}
          alt='Logo'
          width={30}
          height={30}
        />
        Masst Docs
      </>
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
};

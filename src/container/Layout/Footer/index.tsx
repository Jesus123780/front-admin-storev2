import Link from 'next/link'
import { Icon, Text } from 'pkg-components'

import styles from './styles.module.css'

const navLinks = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/search', icon: 'IconSearch', label: 'Explore' },
  { href: '/config', icon: 'IconConfig', label: 'Config' },
  { href: '/configuration', icon: 'IconUser', label: 'Profile' }
]

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      {navLinks.map(({ href, icon, label }) => (
        <Link key={href} className={styles.anchor} href={href}>
          <Icon icon={icon} size={20} />
          <Text>
            {label}
          </Text>
        </Link>
      ))}
    </footer>
  )
}

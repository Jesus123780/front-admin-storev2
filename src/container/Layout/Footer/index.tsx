import React from 'react'
import styles from './styles.module.css'
import { ActiveLink, Text, Icon } from 'pkg-components'

const navLinks = [
  { href: '/dashboard', icon: 'IconHome', label: 'Home' },
  { href: '/search', icon: 'IconSearch', label: 'Explore' },
  { href: '/config', icon: 'IconConfig', label: 'Config' },
  { href: '/configuration', icon: 'IconUser', label: 'Profile' }
]

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* {navLinks.map(({ href, icon, label }) => (
        <ActiveLink key={href} activeClassName={styles.active} href={href}>
          <a className={styles.anchor}>
            <Icon icon={icon} size={20} />
            <Text>{label}</Text>
          </a>
        </ActiveLink>
      ))} */}
    </footer>
  )
}

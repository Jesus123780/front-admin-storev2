"use client"

import { Column } from 'pkg-components'
import React from 'react'
import { Login } from '../../container/login'

export default function Entrar() {
    return (
        <Column as='main'>
            <Login />
        </Column>
    );
}
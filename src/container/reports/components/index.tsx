import React from 'react'
import { useComponentAnalytics } from '../context'
import {
    Column,
    Divider,
    getGlobalStyle,
    HeaderSteps,
    Text
} from 'pkg-components'
import { ChatStatistic } from '@/container/ChatStatistic'
import { ReportDownloadsPanel } from '@/container/reports/components/ReportDownloadsPanel'
import { CustomReportsManager } from './CustomReportsManager'

export const ComponentsReports = () => {
    const {
        active,
        COMPONENTS_STEPS,
        descriptionHeaders,
        setActive
    } = useComponentAnalytics()

    const components: { [key: number]: any } = {
        0: <ChatStatistic />,
        1: <ReportDownloadsPanel />,
    }

    return (
        <Column>
            <HeaderSteps
                steps={COMPONENTS_STEPS}
                active={active}
                setActive={setActive}
            />
            <Divider marginTop={getGlobalStyle('--spacing-md')} />
            <Text as='h2' size='3xl' weight='semibold'>
                {descriptionHeaders[active].title}
            </Text>
            <Divider marginTop={getGlobalStyle('--spacing-xl')} />
            <Text as='p' size='md'>
                {descriptionHeaders[active].description}
            </Text>

            <Divider marginTop={getGlobalStyle('--spacing-xl')} />
            {components[active]}
        </Column>
    )
}

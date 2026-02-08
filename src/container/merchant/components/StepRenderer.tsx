import { STEP_COMPONENTS } from '../steps.config'

type StepRendererProps = {
  step: keyof typeof STEP_COMPONENTS
  stepProps: Record<string, unknown>
}

export const StepRenderer = ({ step, stepProps }: StepRendererProps) => {
  const CurrentStep = STEP_COMPONENTS[step]
  if (!CurrentStep) {
    // Optionally render null or an error message if not a valid component
    return null
  }
  const Component = CurrentStep as React.ElementType
  return <Component {...stepProps} />
}

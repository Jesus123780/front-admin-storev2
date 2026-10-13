'use client'

import {
  useSendWhatsAppMessage,
  useWhatsAppMessageStats,
  useWhatsAppQR,
  useWhatsAppStatus,
} from 'npm-pkg-hook'
import {
  type FormEvent, type ReactNode, useContext, useState
} from 'react'

import styles from './styles.module.css'
import { Context } from '@/context/Context'

type IconName =
  | 'grid'
  | 'link'
  | 'message'
  | 'send'
  | 'refresh'
  | 'check'
  | 'arrow'
  | 'sparkles'
  | 'shield'

type IconProps = { name: IconName; size?: number }

const iconPaths: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a4.5 4.5 0 0 0 6.7.5l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.7 1.7" />
      <path d="M14 10.5a4.5 4.5 0 0 0-6.7-.5l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.7-1.7" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12" />
      <path d="M18.4 15a7 7 0 0 1-11.6 2L4 12" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  arrow: (
    <>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z" />
      <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
}

function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name]}
    </svg>
  )
}

function normalizeStatus(value?: string): string {
  return value?.trim().toLowerCase() ?? 'unknown'
}

export default function WhatsAppDashboard() {
    const { sendNotification } = useContext(Context)
  
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const statusQuery = useWhatsAppStatus()
  const status = statusQuery.data
  const currentStatus = normalizeStatus(status?.status)

  // El backend exige client.isReady() para enviar. `authenticated` no basta.
  const isReady =
    status?.connected === true ||
    currentStatus === 'ready' ||
    currentStatus === 'connected'

  // El backend borra el QR en `authenticated` y `ready`.
  const isAuthenticated = currentStatus === 'authenticated'
  const hasSession = isReady || isAuthenticated

  const qrQuery = useWhatsAppQR({ enabled: !hasSession })
  const sendMutation = useSendWhatsAppMessage()
  const qrSrc = qrQuery.data?.dataUrl

  const statusTone = isReady
    ? styles.statusConnected
    : statusQuery.isError
      ? styles.statusError
      : statusQuery.isPending || isAuthenticated
        ? styles.statusPending
        : styles.statusDisconnected

  const statusLabel = statusQuery.isPending
    ? 'Verificando conexión'
    : statusQuery.isError
      ? 'Servidor no disponible'
      : isReady
        ? 'WhatsApp listo para enviar'
        : isAuthenticated
          ? 'Autenticado · preparando sesión'
          : currentStatus === 'qr_pending'
            ? 'Esperando escaneo QR'
            : `Estado: ${status?.status ?? 'Desconectado'}`

  const canSend =
    isReady &&
    !sendMutation.isPending &&
    Boolean(phone.trim()) &&
    Boolean(message.trim())

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedPhone = phone.trim()
    const normalizedMessage = message.trim()

    if (!normalizedPhone || !normalizedMessage || !isReady) { return }

    try {
      // El backend espera exactamente { phone, message }.
      await sendMutation.mutateAsync({
        phone: normalizedPhone,
        message: normalizedMessage,
      })

      setMessage('')
    } catch (error) {
      // El mensaje de error del backend se muestra en el formulario.
      console.error('No se pudo enviar el mensaje:', error)
    }
  }

  async function handleRefresh() {
    const result = await statusQuery.refetch()
    const refreshedStatus = normalizeStatus(result.data?.status)
    const ready =
      result.data?.connected === true ||
      refreshedStatus === 'ready' ||
      refreshedStatus === 'connected'
    const authenticated = refreshedStatus === 'authenticated'

    if (!ready && !authenticated) {
      await qrQuery.refetch()
    }
  }

  const messageStatsQuery = useWhatsAppMessageStats({
    sendNotification
  })
  const messageStats = messageStatsQuery.data

  return (
    <main className={styles.dashboardShell}>
      <aside className={styles.sidebar}>
        <a href="#overview" className={styles.brand} aria-label="WhatsApp Console, inicio">
          <span className={styles.brandMark}><Icon name="message" size={25} /></span>
          <span className={styles.brandText}>
            <strong>WhatsApp</strong>
            <span>CONSOLE</span>
          </span>
        </a>

        <div className={styles.workspace}>
          <span className={styles.workspaceAvatar}><Icon name="shield" size={20} /></span>
          <span className={styles.workspaceText}>
            <strong>Mi espacio</strong>
            <span>Panel de mensajería</span>
          </span>
          <span className={styles.workspaceChevron} aria-hidden="true">⌄</span>
        </div>

        <nav className={styles.navigation} aria-label="Navegación principal">
          <span className={styles.navSectionTitle}>GENERAL</span>
          <a href="#overview" className={`${styles.navItem} ${styles.navItemActive}`} aria-current="page">
            <Icon name="grid" size={19} />
            <span>Dashboard</span>
          </a>
          <a href="#connection" className={styles.navItem}>
            <Icon name="link" size={19} />
            <span>Conexión</span>
            <span className={`${styles.navIndicator} ${isReady ? styles.navIndicatorConnected : ''}`} />
          </a>
          <a href="#send" className={styles.navItem}>
            <Icon name="send" size={19} />
            <span>Enviar mensaje</span>
          </a>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarHelp}>
            <span className={styles.helpIcon}><Icon name="sparkles" size={20} /></span>
            <strong>Conecta tu cuenta</strong>
            <p>Vincula WhatsApp y envía mensajes desde tu aplicación.</p>
            <a href="#connection" className={styles.helpLink}>
              Ver conexión <Icon name="arrow" size={15} />
            </a>
          </div>
          <div className={styles.sidebarFooter}>
            <span className={styles.footerDot} />
            <span>Panel de mensajería</span>
          </div>
        </div>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumbs}>
            <span>Workspace</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <strong>Dashboard</strong>
          </div>
          <div className={`${styles.statusPill} ${statusTone}`} aria-live="polite">
            <span className={styles.statusDot} />
            {statusLabel}
          </div>
        </header>

        <div className={styles.pageContent}>
          <section id="overview" className={styles.hero}>
            <div>
              <div className={styles.eyebrow}><span className={styles.eyebrowDot} />CENTRO DE MENSAJERÍA</div>
              <h1>Tu WhatsApp, conectado.</h1>
              <p>Gestiona tu conexión y envía mensajes desde un solo lugar.</p>
            </div>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => void handleRefresh()}
              disabled={statusQuery.isFetching || qrQuery.isFetching}
            >
              <span className={statusQuery.isFetching || qrQuery.isFetching ? styles.spinningIcon : ''}>
                <Icon name="refresh" size={17} />
              </span>
              Actualizar estado
            </button>
          </section>

          <section className={styles.overviewCards} aria-label="Resumen de estado">
            <article className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.overviewIconGreen}><Icon name="link" size={20} /></span>
                <span className={styles.overviewCardLabel}>SESIÓN</span>
              </div>
              <strong className={styles.overviewValue}>
                {statusQuery.isPending ? 'Verificando...' : isReady ? 'Lista' : isAuthenticated ? 'Autenticada' : 'Desconectada'}
              </strong>
              <span className={styles.overviewDescription}>Estado informado por el backend</span>
            </article>

            <article className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.overviewIconPurple}><Icon name="message" size={20} /></span>
                <span className={styles.overviewCardLabel}>MENSAJERÍA</span>
              </div>
              <strong className={styles.overviewValue}>{isReady ? 'Disponible' : 'En espera'}</strong>
              <span className={styles.overviewDescription}>El backend debe informar `ready` para enviar</span>
            </article>

            <article className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.overviewIconBlue}><Icon name="shield" size={20} /></span>
                <span className={styles.overviewCardLabel}>API</span>
              </div>
              <strong className={styles.overviewValue}>
                {statusQuery.isError ? 'Sin respuesta' : statusQuery.isPending ? 'Consultando...' : 'Responde'}
              </strong>
              <span className={styles.overviewDescription}>Consulta de `/api/status`</span>
            </article>
          </section>

          <section
            className={styles.overviewCards}
            aria-label="Estadísticas de mensajes en tiempo real"
          >
            <article className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.overviewIconGreen}>
                  <Icon name="message" size={20} />
                </span>
                <span className={styles.overviewCardLabel}>ENTRANTES</span>
              </div>

              <strong className={styles.overviewValue}>
                {messageStatsQuery.isPending
                  ? '...'
                  : (messageStats?.incoming ?? 0)}
              </strong>

              <span className={styles.overviewDescription}>
                Mensajes recibidos
              </span>
            </article>

            <article className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.overviewIconPurple}>
                  <Icon name="send" size={20} />
                </span>
                <span className={styles.overviewCardLabel}>SALIENTES</span>
              </div>

              <strong className={styles.overviewValue}>
                {messageStatsQuery.isPending
                  ? '...'
                  : (messageStats?.outgoing ?? 0)}
              </strong>

              <span className={styles.overviewDescription}>
                Mensajes enviados
              </span>
            </article>

            <article className={styles.overviewCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.overviewIconBlue}>
                  <Icon name="grid" size={20} />
                </span>
                <span className={styles.overviewCardLabel}>TOTAL</span>
              </div>

              <strong className={styles.overviewValue}>
                {messageStatsQuery.isPending
                  ? '...'
                  : (messageStats?.total ?? 0)}
              </strong>

              <span className={styles.overviewDescription}>
                Actividad registrada en esta sesión
              </span>
            </article>
          </section>
          <div className={styles.contentGrid}>
            <section id="connection" className={`${styles.card} ${styles.connectionCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>CUENTA</div>
                  <h2>Conexión de WhatsApp</h2>
                  <p>Escanea el código QR para vincular tu cuenta.</p>
                </div>
                <span className={`${styles.connectionBadge} ${isReady ? styles.connectionBadgeActive : styles.connectionBadgeInactive}`}>
                  <span className={styles.statusDot} />
                  {isReady ? 'Lista' : isAuthenticated ? 'Preparando' : 'Pendiente'}
                </span>
              </div>

              {statusQuery.isError && (
                <div className={styles.inlineError} role="alert">
                  <span className={styles.alertSymbol}>!</span>
                  <div>
                    <strong>No se pudo consultar el estado</strong>
                    <p>{statusQuery.error instanceof Error ? statusQuery.error.message : 'Comprueba que el backend esté activo.'}</p>
                  </div>
                </div>
              )}

              {isReady ? (
                <div className={styles.connectedPanel}>
                  <div className={styles.connectedIcon}><Icon name="check" size={30} /></div>
                  <span className={styles.connectedLabel}>WHATSAPP LISTO</span>
                  <h3>¡Tu WhatsApp está listo!</h3>
                  <p>El backend informa que la sesión está en estado `ready`. Ya puedes enviar mensajes.</p>
                  <a href="#send" className={styles.primaryLink}>Enviar un mensaje <Icon name="arrow" size={17} /></a>
                </div>
              ) : isAuthenticated ? (
                <div className={styles.connectedPanel}>
                  <div className={styles.connectedIcon}><Icon name="refresh" size={30} /></div>
                  <span className={styles.connectedLabel}>AUTENTICACIÓN COMPLETADA</span>
                  <h3>Preparando la sesión</h3>
                  <p>WhatsApp está autenticado, pero el backend todavía no informa `ready`. El envío se habilitará cuando el cliente esté listo.</p>
                </div>
              ) : (
                <>
                  <div className={styles.qrInstructions}>
                    <span className={styles.qrStepNumber}>01</span>
                    <div>
                      <h3>Escanea tu código QR</h3>
                      <p>Abre WhatsApp en tu teléfono y entra a Dispositivos vinculados para asociar tu cuenta.</p>
                    </div>
                  </div>

                  <div className={styles.qrStage}>
                    {qrQuery.isPending ? (
                      <div className={styles.qrPlaceholder}>
                        <span className={styles.spinner} />
                        <strong>Preparando código QR</strong>
                        <span>Esperando respuesta del servidor...</span>
                      </div>
                    ) : qrQuery.isError ? (
                      <div className={styles.qrPlaceholder}>
                        <span className={styles.qrErrorIcon}>!</span>
                        <strong>No se pudo obtener el QR</strong>
                        <span>{qrQuery.error instanceof Error ? qrQuery.error.message : 'Intenta consultar nuevamente el código.'}</span>
                        <button type="button" onClick={() => void qrQuery.refetch()} className={styles.refreshButton}>
                          <Icon name="refresh" size={16} /> Reintentar
                        </button>
                      </div>
                    ) : qrSrc ? (
                      <div className={styles.qrImageWrapper}>
                        <img className={styles.qrImage} src={qrSrc} alt="Código QR para vincular WhatsApp" />
                        <span className={styles.qrImageCaption}>Escanea con tu teléfono</span>
                      </div>
                    ) : (
                      <div className={styles.qrPlaceholder}>
                        <span className={styles.qrEmptyIcon}><Icon name="message" size={27} /></span>
                        <strong>QR todavía no disponible</strong>
                        <span>{qrQuery.data?.message ?? 'El backend aún no ha recibido un código QR.'}</span>
                        <button type="button" onClick={() => void qrQuery.refetch()} className={styles.refreshButton}>
                          <Icon name="refresh" size={16} /> Consultar QR
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.qrTip}>
                    <Icon name="shield" size={17} />
                    <p>No compartas este código. Permite vincular una sesión de WhatsApp a tu dispositivo.</p>
                  </div>
                </>
              )}
            </section>

            <section id="send" className={`${styles.card} ${styles.messageCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardEyebrow}>MENSAJERÍA</div>
                  <h2>Enviar mensaje</h2>
                  <p>Redacta un mensaje y envíalo a un número de WhatsApp.</p>
                </div>
                <span className={styles.messageHeaderIcon}><Icon name="send" size={21} /></span>
              </div>

              <div className={styles.formConnectionNotice}>
                <span className={`${styles.statusDot} ${isReady ? styles.connectedNoticeDot : styles.disconnectedNoticeDot}`} />
                <span>
                  {isReady
                    ? 'Sesión lista para enviar mensajes'
                    : isAuthenticated
                      ? 'Autenticado; esperando que WhatsApp esté listo'
                      : 'Conecta WhatsApp para habilitar el envío'}
                </span>
              </div>

              <form className={styles.form} onSubmit={handleSendMessage}>
                <div className={styles.field}>
                  <label htmlFor="whatsapp-phone">Número de teléfono<span className={styles.requiredMark}>*</span></label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><Icon name="message" size={18} /></span>
                    <input
                      id="whatsapp-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="573001234567"
                      aria-describedby="whatsapp-phone-help"
                      required
                    />
                  </div>
                  <span id="whatsapp-phone-help" className={styles.fieldHint}>
                    Incluye el código de país. Ejemplo para Colombia: 573001234567.
                  </span>
                </div>

                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label htmlFor="whatsapp-message">Mensaje<span className={styles.requiredMark}>*</span></label>
                    <span className={styles.characterCount}>{message.length} caracteres</span>
                  </div>
                  <textarea
                    id="whatsapp-message"
                    name="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="¡Hola! ¿Cómo estás? 👋"
                    rows={6}
                    required
                  />
                </div>

                {sendMutation.isSuccess && (
                  <div className={styles.successNotice} role="status" aria-live="polite">
                    <span className={styles.feedbackIcon}><Icon name="check" size={17} /></span>
                    <span>{sendMutation.data?.message ?? 'El backend aceptó la solicitud de envío.'}</span>
                  </div>
                )}

                {sendMutation.isError && (
                  <div className={styles.errorNotice} role="alert" aria-live="assertive">
                    <span className={styles.feedbackIcon}>!</span>
                    <span>{sendMutation.error instanceof Error ? sendMutation.error.message : 'No se pudo enviar el mensaje.'}</span>
                  </div>
                )}

                {!isReady && (
                  <p className={styles.disabledHint}>
                    <Icon name="shield" size={16} />
                    {isAuthenticated
                      ? 'Espera a que el backend informe el estado ready.'
                      : 'Conecta tu cuenta mediante el código QR para habilitar el envío.'}
                  </p>
                )}

                <button type="submit" className={styles.submitButton} disabled={!canSend}>
                  {sendMutation.isPending ? (
                    <>
                      <span className={styles.buttonSpinner} />
                      Enviando mensaje...
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={18} />
                      Enviar mensaje
                      <span className={styles.buttonArrow}><Icon name="arrow" size={16} /></span>
                    </>
                  )}
                </button>

                <div className={styles.formFooter}>
                  <Icon name="shield" size={15} />
                  <span>El resultado indica lo que confirmó el backend, no la lectura del destinatario.</span>
                </div>
              </form>
            </section>
          </div>


          <footer className={styles.pageFooter}>
            <span><span className={styles.footerDot} />Panel de WhatsApp</span>
            <span>Conexión y mensajería en un solo lugar</span>
          </footer>
        </div>
      </div>
    </main>
  )
}

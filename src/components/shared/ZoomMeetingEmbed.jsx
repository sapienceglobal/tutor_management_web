'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Video, VideoOff, RefreshCw, LogOut, AlertTriangle, Clock, Menu } from 'lucide-react';
import { T } from '@/constants/studentTokens';

/**
 * ZoomMeetingEmbed
 * Renders a Zoom Web SDK meeting inside an iframe (/public/zoom-embed.html)
 * and overlays a polished loading / error / ended UI on top.
 *
 * Sync notes (must match /public/zoom-embed.html):
 * - iframe announces readiness via { type: 'ZOOM_READY' } once its message
 *   listener is registered AND the SDK script has finished loading (or
 *   failed). We only postMessage ZOOM_INIT after receiving this — removes
 *   the race condition where init could be sent before the iframe's SDK
 *   was ready to receive it.
 * - All postMessage calls use window.location.origin, not '*'.
 * - A handshake timeout exists in case ZOOM_READY never arrives.
 * - ZOOM_RECONNECTING -> ZOOM_CONNECTED restores connectionQuality to 'good'.
 */

const HANDSHAKE_TIMEOUT_MS = 15000;

export default function ZoomMeetingEmbed({ config, onLeave, sessionLabel = 'Live Class' }) {
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState(null);
    const [connectionQuality, setConnectionQuality] = useState('good');
    const [elapsedTime, setElapsedTime] = useState(0);

    const iframeRef = useRef(null);
    const timerRef = useRef(null);
    const handshakeTimeoutRef = useRef(null);
    const initSentRef = useRef(false);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const clearHandshakeTimeout = () => {
        if (handshakeTimeoutRef.current) {
            clearTimeout(handshakeTimeoutRef.current);
            handshakeTimeoutRef.current = null;
        }
    };

    const fail = useCallback((message, code = 'UNKNOWN') => {
        clearHandshakeTimeout();
        setStatus('error');
        setErrorMessage(message);
        setErrorCode(code);
    }, []);

    useEffect(() => {
        if (!config) {
            fail('No meeting configuration was provided.', 'CONFIG_MISSING');
            return;
        }
        if (!config.sdkKey || !config.signature || !config.meetingNumber) {
            fail('Missing required Zoom credentials (SDK Key, Signature, or Meeting Number).', 'CONFIG_INVALID');
        }
    }, [config, fail]);

    const sendInit = useCallback(() => {
        if (initSentRef.current) return;
        if (!iframeRef.current?.contentWindow) return;
        if (!config?.sdkKey || !config?.signature || !config?.meetingNumber) return;

        initSentRef.current = true;
        clearHandshakeTimeout();
        iframeRef.current.contentWindow.postMessage(
            { type: 'ZOOM_INIT', config },
            window.location.origin
        );
    }, [config]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;
            if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;

            const data = event.data;
            if (!data || !data.type) return;

            switch (data.type) {
                case 'ZOOM_READY':
                    sendInit();
                    break;
                case 'ZOOM_JOINING':
                    setStatus('joining');
                    break;
                case 'ZOOM_JOINED':
                case 'ZOOM_CONNECTED':
                    clearHandshakeTimeout();
                    setStatus('active');
                    setConnectionQuality('good');
                    if (!timerRef.current) {
                        timerRef.current = setInterval(() => {
                            setElapsedTime((prev) => prev + 1);
                        }, 1000);
                    }
                    break;
                case 'ZOOM_RECONNECTING':
                    setConnectionQuality('poor');
                    break;
                case 'ZOOM_ERROR':
                    fail(data.message || 'An error occurred connecting to Zoom.', data.code || 'UNKNOWN');
                    break;
                case 'ZOOM_ENDED':
                    clearHandshakeTimeout();
                    setStatus('ended');
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    if (onLeave) onLeave();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            if (timerRef.current) clearInterval(timerRef.current);
            clearHandshakeTimeout();
        };
    }, [onLeave, sendInit, fail]);

    const handleIframeLoad = () => {
        clearHandshakeTimeout();
        handshakeTimeoutRef.current = setTimeout(() => {
            if (!initSentRef.current) {
                fail(
                    'Timed out waiting for the meeting frame to respond. Please check your connection and retry.',
                    'HANDSHAKE_TIMEOUT'
                );
            }
        }, HANDSHAKE_TIMEOUT_MS);
        // zoom-embed.html sends ZOOM_READY itself once it's actually ready;
        // we don't send ZOOM_INIT directly from here anymore.
    };

    const handleRetry = () => window.location.reload();
    const showOverlay = status !== 'active';

    const toggleChrome = () => {
        window.dispatchEvent(new CustomEvent('lms:toggle-chrome'));
        // Give the layout a frame to mount/unmount its overlay, then nudge
        // Zoom to re-measure in case anything around it changed.
        if (iframeRef.current?.contentWindow) {
            setTimeout(() => {
                iframeRef.current.contentWindow.postMessage(
                    { type: 'ZOOM_FORCE_RESIZE' },
                    window.location.origin
                );
            }, 250);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#0B0A1A',
                overflow: 'hidden',
                zIndex: 9999,
                fontFamily: T.fontFamily,
            }}
        >
            <iframe
                ref={iframeRef}
                src="/zoom-embed.html?v=9"
                onLoad={handleIframeLoad}
                allow="camera; microphone; display-capture; autoplay"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 10,
                    visibility: status === 'active' ? 'visible' : 'hidden',
                }}
            />

            {/*
              We deliberately do NOT render a custom top bar over the
              meeting anymore — Zoom's own embedded toolbar already shows
              participants, leave, mic/camera, and a "more" menu, and a
              second bar on top of it just covered those controls (see
              the screenshot bug report). Instead we show a single small
              floating button that brings back the LMS sidebar+header as
              an overlay, exactly like Zoom/Meet's "show controls" pattern.
            */}
            {status === 'active' && (
                <ChromeToggleButton onClick={toggleChrome} />
            )}

            {showOverlay && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 100,
                        background:
                            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.18) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(168,85,247,0.14) 0%, transparent 50%), linear-gradient(160deg, #0B0A1A 0%, #14102E 55%, #1B1440 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        overflow: 'hidden',
                    }}
                >
                    <BackgroundGrid />

                    {(status === 'loading' || status === 'joining') && (
                        <LoadingCard status={status} config={config} />
                    )}

                    {status === 'error' && (
                        <ErrorCard
                            errorMessage={errorMessage}
                            errorCode={errorCode}
                            onRetry={handleRetry}
                            onLeave={onLeave}
                        />
                    )}

                    {status === 'ended' && (
                        <EndedCard
                            sessionLabel={sessionLabel}
                            config={config}
                            elapsedTime={elapsedTime}
                            formatTime={formatTime}
                            onLeave={onLeave}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

/* ---------------------------------- */
/* Subcomponents                      */
/* ---------------------------------- */

function BackgroundGrid() {
    return (
        <div
            aria-hidden
            style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(circle at 50% 40%, black 0%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 0%, transparent 75%)',
            }}
        />
    );
}

function GlassCard({ children, maxWidth = '380px' }) {
    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '24px',
                padding: '44px 40px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
                width: '90%',
                maxWidth,
            }}
        >
            {children}
        </div>
    );
}

function IconBadge({ children, tint = '#6366F1', tint2 = '#A855F7', solid = false, ringColor }) {
    return (
        <div
            style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                margin: '0 auto 22px',
                background: solid ? tint : `linear-gradient(135deg, ${tint}, ${tint2})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 24px ${tint}55`,
                border: ringColor ? `1px solid ${ringColor}` : 'none',
            }}
        >
            {children}
        </div>
    );
}

function LoadingCard({ status, config }) {
    const isJoining = status === 'joining';
    return (
        <GlassCard>
            <IconBadge tint="#6366F1" tint2="#A855F7">
                <Video size={28} color="#fff" />
            </IconBadge>

            <h2
                style={{
                    fontSize: T.size.md,
                    fontWeight: T.weight.black,
                    color: '#fff',
                    marginBottom: '6px',
                    letterSpacing: '-0.01em',
                }}
            >
                {isJoining ? 'Joining the Meeting' : 'Preparing Your Class'}
            </h2>

            {config?.classTitle && (
                <p
                    style={{
                        fontSize: T.size.sm,
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: '28px',
                    }}
                >
                    {config.classTitle}
                </p>
            )}

            <Spinner />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', marginTop: '22px' }}>
                <StatusPill active={!isJoining} done={isJoining} label="Connecting to meeting frame" />
                <StatusPill active={isJoining} done={false} label="Joining meeting room" />
            </div>
        </GlassCard>
    );
}

function Spinner() {
    return (
        <div style={{ position: 'relative', width: '44px', height: '44px', margin: '0 auto' }}>
            <div
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '3px solid rgba(165,160,255,0.15)',
                    borderTopColor: '#8B7CF6',
                    animation: 'zoom-embed-spin 0.9s linear infinite',
                }}
            />
            <style>{`@keyframes zoom-embed-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function StatusPill({ active, done, label }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                borderRadius: '10px',
                background: active ? 'rgba(139,124,246,0.1)' : 'transparent',
                border: active ? '1px solid rgba(139,124,246,0.18)' : '1px solid transparent',
                width: '100%',
                maxWidth: '260px',
                justifyContent: 'flex-start',
            }}
        >
            <div
                style={{
                    width: '6px',
                    height: '6px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: done ? '#10B981' : active ? '#8B7CF6' : 'rgba(255,255,255,0.15)',
                }}
            />
            <span
                style={{
                    fontSize: '12px',
                    fontWeight: T.weight.bold,
                    color: done ? '#34D399' : active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                }}
            >
                {done ? '✓ ' : ''}
                {label}
            </span>
        </div>
    );
}

function ErrorCard({ errorMessage, errorCode, onRetry, onLeave }) {
    return (
        <GlassCard maxWidth="440px">
            <IconBadge tint="rgba(244,63,94,0.14)" solid ringColor="rgba(244,63,94,0.25)">
                <AlertTriangle size={26} color="#FB7185" />
            </IconBadge>

            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: '#FCA5A5', marginBottom: '10px' }}>
                Connection Failed
            </h2>
            <p style={{ fontSize: T.size.sm, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '6px' }}>
                {errorMessage}
            </p>
            {errorCode && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '26px', fontFamily: 'monospace' }}>
                    ERROR · {errorCode}
                </p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                <PrimaryButton onClick={onRetry} icon={<RefreshCw size={15} />} label="Retry Connection" />
                <SecondaryButton onClick={onLeave} icon={<LogOut size={15} />} label="Go Back" />
            </div>
        </GlassCard>
    );
}

function EndedCard({ sessionLabel, config, elapsedTime, formatTime, onLeave }) {
    return (
        <GlassCard>
            <IconBadge tint="rgba(16,185,129,0.14)" solid ringColor="rgba(16,185,129,0.25)">
                <VideoOff size={26} color="#34D399" />
            </IconBadge>

            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: '#fff', marginBottom: '6px' }}>
                {sessionLabel} Ended
            </h2>
            {config?.classTitle && (
                <p style={{ fontSize: T.size.sm, color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
                    {config.classTitle}
                </p>
            )}
            <p
                style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.35)',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                }}
            >
                <Clock size={11} /> Duration: {formatTime(elapsedTime)}
            </p>

            <PrimaryButton onClick={onLeave} icon={<LogOut size={15} />} label="Return to Dashboard" full />
        </GlassCard>
    );
}

function PrimaryButton({ onClick, icon, label, full = false }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: full ? '100%' : 'auto',
                margin: full ? '0 auto' : undefined,
                padding: '12px 24px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                color: '#fff',
                fontSize: T.size.sm,
                fontWeight: T.weight.bold,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(99,102,241,0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 22px rgba(99,102,241,0.5)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.4)';
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function SecondaryButton({ onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: T.size.sm,
                fontWeight: T.weight.bold,
                cursor: 'pointer',
            }}
        >
            {icon}
            {label}
        </button>
    );
}


function ChromeToggleButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            title="Show menu"
            style={{
                position: 'absolute',
                // Zoom's own embedded toolbar renders small corner icons
                // (participants, "more") right around the top 16-40px of
                // the meeting area. A 16px offset collided with it — this
                // button now sits clearly below that strip.
                top: '64px',
                right: '16px',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(15,12,30,0.6)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '12px',
                fontWeight: T.weight.bold,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                pointerEvents: 'auto',
                transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
                e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15,12,30,0.6)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
            }}
        >
            <Menu size={14} />
            Menu
        </button>
    );
}
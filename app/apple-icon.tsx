import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180
};

export const contentType = 'image/png';

/**
 * apple-icon generates the iOS home-screen icon used when investModel is saved from Safari.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#246BFE',
          color: '#FFFFFF',
          display: 'flex',
          fontFamily: 'Arial, sans-serif',
          fontSize: 56,
          fontWeight: 800,
          height: '100%',
          justifyContent: 'center',
          letterSpacing: 0,
          width: '100%'
        }}
      >
        iM
      </div>
    ),
    size
  );
}

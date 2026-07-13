import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512
};

export const contentType = 'image/png';

/**
 * icon generates the primary PWA app icon for the investModel mobile shell.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#246BFE',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
          height: '100%',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: '#FFFFFF',
            borderRadius: 96,
            color: '#246BFE',
            display: 'flex',
            fontSize: 148,
            fontWeight: 800,
            height: 232,
            justifyContent: 'center',
            letterSpacing: 0,
            width: 232
          }}
        >
          iM
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 0,
            marginTop: 38
          }}
        >
          investModel
        </div>
      </div>
    ),
    size
  );
}

export type ExperiencePhase =
  | 'locked'
  | 'key-ready'
  | 'unlocking'
  | 'opening'
  | 'playing'
  | 'paused'
  | 'ending'
  | 'finale';

export interface LyricCue {
  id: number;
  stanza: number;
  text: string;
  /** Playback timestamp in seconds from start of YouTube video. Null until configured. */
  startTime: number | null;
}

export interface CharacterLayerSet {
  full: string;
  head: string;
  torso: string;
  leftArm: string;
  rightArm: string;
  lower: string;
  leftLeg?: string;
  rightLeg?: string;
  veil?: string;
}

export interface ExtractedCoupleAssets {
  bride: CharacterLayerSet;
  groom: CharacterLayerSet;
}

export interface DancerPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  headTilt: number;
  headNod: number;
  torsoLean: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftArmLift: number;
  rightArmLift: number;
  lowerSway: number;
  leftLegLift: number;
  rightLegLift: number;
  leftLegAngle: number;
  rightLegAngle: number;
  veilSway: number;
  stepLift: number;
  facingBack: boolean;
  scale: number;
}

export interface ChoreographyFrame {
  turntableAngle: number;
  windKeyAngle: number;
  cameraZoom: number;
  bride: DancerPose;
  groom: DancerPose;
  romanceHeartOpacity: number;
  endingProgress: number;
}

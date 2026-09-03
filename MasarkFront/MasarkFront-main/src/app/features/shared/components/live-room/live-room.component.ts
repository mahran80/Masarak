import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, OnDestroy, inject, signal, ViewChild, effect, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, IAgoraRTCRemoteUser, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { LiveSessionService } from '../../services/live-session.service';
import { WhiteboardComponent } from '../whiteboard/whiteboard.component';
import { AuthStateService } from '../../../../core/services/auth-state-service';

import { NgClass } from '@angular/common';

@Component({
  selector: 'app-live-room',
  standalone: true,
  imports: [IconComponent, WhiteboardComponent, NgClass],
  templateUrl: './live-room.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveRoomComponent implements OnInit, OnDestroy {
  @ViewChild('whiteboardComp') whiteboardComp?: WhiteboardComponent;

  public readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  public readonly liveSessionService = inject(LiveSessionService);
  public readonly authState = inject(AuthStateService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isMuted = signal(false);
  readonly isCameraOff = signal(false);
  
  readonly isWhiteboardActive = signal(false);
  readonly currentUserId = signal('');
  readonly isTeacher = signal(false);
  readonly isScreenSharing = signal(false);
  
  // Agora client
  private client!: IAgoraRTCClient;
  private localAudioTrack!: IMicrophoneAudioTrack;
  private localVideoTrack!: ILocalVideoTrack;


  readonly remoteUsers = signal<IAgoraRTCRemoteUser[]>([]);

  readonly teacherUid = computed(() => {
    const participants = this.liveSessionService.participants();
    const teacher = participants.find(p => p.role === 'Teacher');
    return teacher ? teacher.uid.toString() : null;
  });

  getParticipantRole(uid: string): string {
    const p = this.liveSessionService.participants().find(x => x.uid.toString() === uid);
    return p?.role === 'Teacher' ? 'المحاضر' : 'طالب';
  }

  getParticipantName(uid: string): string {
    const p = this.liveSessionService.participants().find(x => x.uid.toString() === uid);
    return p?.name || 'مستخدم غير معروف';
  }

  constructor() {
    effect(() => {
      const active = this.liveSessionService.whiteboardActive();
      if (this.isWhiteboardActive() !== active) {
        this.isWhiteboardActive.set(active);
        
        // Ensure local player handles video rendering when whiteboard closes remotely
        if (!active && this.localVideoTrack) {
          setTimeout(() => {
            const player = document.getElementById('local-player');
            if (player) {
              player.innerHTML = '';
              this.localVideoTrack.play('local-player');
            }
          }, 0);
        }
      }
    });
  }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('id');
    const role = this.route.snapshot.data['role'] as 'teacher' | 'student';

    this.isTeacher.set(role === 'teacher');
    this.currentUserId.set(this.authState.user()?.userId.toString() || '');

    if (!sessionId) {
      this.errorMessage.set('Invalid session ID');
      this.isLoading.set(false);
      return;
    }

    this.initializeAgora(sessionId, role);
  }

  private async initializeAgora(sessionId: string, role: 'teacher' | 'student'): Promise<void> {
    try {
      // 1. Fetch token
      const endpoint = `${environment.apiUrl}/${role}/sessions/${sessionId}/token`;
      this.http.get<{ token: string; channelName: string; uid: string }>(endpoint)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: async (res) => {
            await this.liveSessionService.joinSession(sessionId);
            await this.joinChannel(res.token, res.channelName, res.uid);
          },
          error: (err) => {
            this.errorMessage.set('Failed to connect to the live session. Please check your permissions.');
            this.isLoading.set(false);
          }
        });
    } catch (e) {
      console.error(e);
      this.errorMessage.set('An error occurred while joining the session.');
      this.isLoading.set(false);
    }
  }

  private async joinChannel(token: string, channel: string, uid: string): Promise<void> {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await this.client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack;
        setTimeout(() => {
          remoteVideoTrack?.play(`remote-player-${user.uid}`);
        }, 100);
      }
      if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        remoteAudioTrack?.play();
      }
      
      this.updateRemoteUsers();
    });

    this.client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
      this.updateRemoteUsers();
    });

    this.client.on('user-left', (user: IAgoraRTCRemoteUser) => {
      this.updateRemoteUsers();
    });

    // TODO: In a real app, use the actual App ID here
    const APP_ID = "1cd09ce2f89b49a8954996d4cc189a85"; 

    try {
      await this.client.join(APP_ID, channel, token, Number(uid));
      
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
      
      // Play local video
      this.localVideoTrack.play('local-player');
      
      this.isLoading.set(false);

    } catch (e) {
      console.error('Agora join failed', e);
      // Because we're using a mock token, this will fail in development. 
      // We will show a mock UI if joining fails.
      this.isLoading.set(false);
      this.errorMessage.set('Connected in Mock Mode. (Real App ID needed for video).');
    }
  }

  private updateRemoteUsers(): void {
    this.remoteUsers.set([...this.client.remoteUsers]);
  }

  async toggleMic(): Promise<void> {
    if (this.localAudioTrack) {
      const muted = !this.isMuted();
      await this.localAudioTrack.setMuted(muted);
      this.isMuted.set(muted);
    }
  }

  async toggleCamera(): Promise<void> {
    if (this.localVideoTrack && !this.isScreenSharing()) {
      const off = !this.isCameraOff();
      await this.localVideoTrack.setMuted(off);
      this.isCameraOff.set(off);
    }
  }

  async toggleScreenShare(): Promise<void> {
    if (!this.isTeacher()) return;

    try {
      if (this.isScreenSharing()) {
        // Stop screen share, revert to camera
        if (this.localVideoTrack) {
          await this.client.unpublish(this.localVideoTrack);
          this.localVideoTrack.close();
        }
        
        try {
          this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          await this.localVideoTrack.setMuted(this.isCameraOff());
          await this.client.publish(this.localVideoTrack);
          
          // Re-play local player if it exists
          setTimeout(() => {
            const player = document.getElementById('local-player');
            if (player) {
              player.innerHTML = '';
              this.localVideoTrack.play('local-player');
            }
          }, 0);
        } catch (e) {
          console.warn('Camera not available after stopping screen share:', e);
          this.localVideoTrack = undefined as any;
        }
        
        this.isScreenSharing.set(false);
      } else {
        // Start screen share
        let screenTrack;
        try {
          screenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");
        } catch (e: any) {
          if (e.message?.includes('PERMISSION_DENIED') || e.code === 'PERMISSION_DENIED' || e.name === 'NotAllowedError') {
            console.warn('Screen share permission denied by user.');
            return; // Just abort the toggle
          }
          throw e;
        }
        
        // createScreenVideoTrack can return an array or a single track depending on browser capabilities
        const trackToPublish = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
        
        if (this.localVideoTrack) {
          await this.client.unpublish(this.localVideoTrack);
          this.localVideoTrack.close();
        }
        
        this.localVideoTrack = trackToPublish;
        await this.client.publish(this.localVideoTrack);
        
        // Ensure whiteboard is closed when screen sharing
        if (this.isWhiteboardActive()) {
          this.isWhiteboardActive.set(false);
          this.liveSessionService.whiteboardActive.set(false);
          const sessionId = this.route.snapshot.paramMap.get('id');
          if (sessionId) {
            this.liveSessionService.toggleWhiteboard(sessionId, false);
          }
        }

        // Re-play local player if it exists
        setTimeout(() => {
          const player = document.getElementById('local-player');
          if (player) {
            player.innerHTML = '';
            this.localVideoTrack.play('local-player');
          }
        }, 0);

        // Listen for user stopping screen share via browser UI
        this.localVideoTrack.on('track-ended', () => {
          if (this.isScreenSharing()) {
            this.toggleScreenShare();
          }
        });
        
        this.isScreenSharing.set(true);
      }
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
      // Ensure state is reverted on failure
      if (this.isScreenSharing()) {
         this.isScreenSharing.set(false);
      }
    }
  }

  hasWhiteboardAccess(uid: string): boolean {
    return this.liveSessionService.whiteboardWritableUsers().includes(uid);
  }

  async grantWhiteboardAccess(uid: string): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      await this.liveSessionService.grantWhiteboardAccess(sessionId, uid);
    }
  }

  async revokeWhiteboardAccess(uid: string): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      await this.liveSessionService.revokeWhiteboardAccess(sessionId, uid);
    }
  }

  async toggleWhiteboard(): Promise<void> {
    if (this.isTeacher()) {
      // Ensure screen share is closed when opening whiteboard
      if (!this.isWhiteboardActive() && this.isScreenSharing()) {
        this.toggleScreenShare(); // Turn off screen share
      }
      
      const newState = !this.isWhiteboardActive();
      this.isWhiteboardActive.set(newState);
      this.liveSessionService.whiteboardActive.set(newState); // sync service signal
      
      const sessionId = this.route.snapshot.paramMap.get('id');
      if (sessionId) {
        await this.liveSessionService.toggleWhiteboard(sessionId, newState);
      }
      
      // If whiteboard is closed, we need to re-attach the video to the local player
      if (!newState && this.localVideoTrack) {
        setTimeout(() => {
          const player = document.getElementById('local-player');
          if (player) {
            player.innerHTML = '';
            this.localVideoTrack.play('local-player');
          }
        }, 0);
      }
    }
  }

  async leaveSession(): Promise<void> {
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();
    await this.client?.leave();
    
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      await this.liveSessionService.leaveSession(sessionId);
    }
    
    // Navigate back based on role
    const role = this.route.snapshot.data['role'];
    if (role === 'teacher') {
      this.router.navigate(['/dashboard/teacher/sessions']);
    } else {
      this.router.navigate(['/dashboard/student/schedule']);
    }
  }

  async ngOnDestroy(): Promise<void> {
    try {
      this.localAudioTrack?.close();
      this.localVideoTrack?.close();
      await this.client?.leave();
      
      const sessionId = this.route.snapshot.paramMap.get('id');
      if (sessionId) {
        await this.liveSessionService.leaveSession(sessionId);
      }
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}

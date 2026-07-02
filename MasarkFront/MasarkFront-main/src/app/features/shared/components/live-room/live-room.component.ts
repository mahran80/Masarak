import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

@Component({
  selector: 'app-live-room',
  standalone: true,
  templateUrl: './live-room.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveRoomComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isMuted = signal(false);
  readonly isCameraOff = signal(false);
  
  // Agora client
  private client!: IAgoraRTCClient;
  private localAudioTrack!: IMicrophoneAudioTrack;
  private localVideoTrack!: ICameraVideoTrack;

  readonly remoteUsers = signal<IAgoraRTCRemoteUser[]>([]);

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('id');
    const role = this.route.snapshot.data['role'] as 'teacher' | 'student';

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
      await this.client.join(APP_ID, channel, token, uid);
      
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
    if (this.localVideoTrack) {
      const off = !this.isCameraOff();
      await this.localVideoTrack.setMuted(off);
      this.isCameraOff.set(off);
    }
  }

  async leaveSession(): Promise<void> {
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();
    await this.client?.leave();
    
    // Navigate back based on role
    const role = this.route.snapshot.data['role'];
    if (role === 'teacher') {
      this.router.navigate(['/dashboard/teacher/sessions']);
    } else {
      this.router.navigate(['/dashboard/student/schedule']);
    }
  }
}

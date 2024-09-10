import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxYoutubePlayerModule } from 'ngx-youtube-player';
import { VideoDownloadService } from '../video-download.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [FormsModule,NgxYoutubePlayerModule],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss'
})
export class VideoPlayerComponent {
  youtubeUrl: string = '';
  videoId: string = '';
  player: any;
  videoLoaded: boolean = false;
  startFrame: number | null = null;
  endFrame: number | null = null;
  gifUrlList: string[] = [];
  

  constructor (private videoDownloadService: VideoDownloadService ) {}

  ngOnInit() {
    this.loadYouTubeIframeAPI();
  }

  loadYouTubeIframeAPI() {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
  }

  playVideo() {
    const videoId = this.extractVideoId(this.youtubeUrl);
    if (videoId) {
      this.videoId = videoId;
      this.initializePlayer();
    }
  }

  extractVideoId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  initializePlayer() {
    this.player = new YT.Player('player', {
      videoId: this.videoId,
      width: 1152,
      height: 648,
      events: {
        'onReady': this.onPlayerReady.bind(this)
      },
      playerVars: {
        enablejsapi: 1,
        'origin': window.location.origin,
        rel: 0,
      }
    });
  }

  onPlayerReady(event: any) {
    this.videoLoaded = true;
  }

  selectFrame(type: 'start' | 'end') {
    console.log(this.player);
    const currentTime = this.player.getCurrentTime();
    if (type === 'start') {
      this.startFrame = currentTime;
    } else if (type === 'end') {
      this.endFrame = currentTime;
    }
  }

  sendFrames() {
    if (this.startFrame !== null && this.endFrame !== null) {
      this.videoDownloadService.downloadGif(this.youtubeUrl, this.startFrame, this.endFrame).subscribe((response) => {
        const blob = new Blob([response], { type: 'image/gif' });
        const url = window.URL.createObjectURL(blob);
        this.gifUrlList.push(url);  // Display the GIF
      });
    }
  }
}

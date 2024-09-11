import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxYoutubePlayerModule } from 'ngx-youtube-player';
import { VideoDownloadService } from '../video-download.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [FormsModule,NgxYoutubePlayerModule],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
  host: {
    '(document:keypress)': 'handleKeyboardEvent($event);'
  }
})
export class VideoPlayerComponent {
  youtubeUrl: string = '';
  videoId: string = '';
  player!: YT.Player;
  videoLoaded: boolean = false;
  startFrame: number = 0;
  endFrame: number = 0;
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
        // enablejsapi: 1,
        // 'origin': window.location.origin,
        rel: 0,
        autoplay: 1,
        controls: 0,
        disablekb: 1,
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
      this.startFrame = parseFloat(currentTime.toFixed(1));
    } else if (type === 'end') {
      this.endFrame = parseFloat(currentTime.toFixed(1));
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

  handleKeyboardEvent(event: KeyboardEvent) {
    console.log(event.key);
    if(event.key == 'a') {
      this.player.seekTo(this.player.getCurrentTime() - 1, true);
    } else if (event.key == 'd') {
      this.player.seekTo(this.player.getCurrentTime() + 1, true);
    }else if (event.key == 'q') {
      this.player.seekTo(this.player.getCurrentTime() - 2.5, true);
    } else if (event.key == 'e') {
      this.player.seekTo(this.player.getCurrentTime() + 2.5, true);
    } else if (event.key == 'z') {
      this.selectFrame('start');
    } else if(event.key == 'c') {
      this.selectFrame('end');
    } else if (event.key == 'x') {
      this.sendFrames();
    } else if (event.key == ' ') {
      let state = this.player.getPlayerState();
      if (state == 1) {
        this.player.pauseVideo();
      } else if (state == 2) {
        this.player.playVideo();
      } else if (state == -1) {
        this.player.playVideo();
      }
    }

  }
}

import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveSessionService } from '../../services/live-session.service';
import { effect } from '@angular/core';

export type WhiteboardMode = 'draw' | 'erase';

@Component({
  selector: 'app-whiteboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.css']
})
export class WhiteboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('board', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  readonly sessionId = input.required<string>();
  readonly isTeacher = input<boolean>(false);
  readonly currentUserId = input.required<string>();

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  public currentMode: WhiteboardMode = 'draw';
  public currentColor = '#000000';
  public currentSize = 2;
  private lastX = 0;
  private lastY = 0;

  private readonly liveSessionService = inject(LiveSessionService);

  constructor() {
    effect(() => {
      const drawEvent = this.liveSessionService.whiteboardDrawEvents();
      if (drawEvent) {
        if (drawEvent.mode === 'draw' || drawEvent.mode === 'erase') {
          this.drawLine(drawEvent.x0, drawEvent.y0, drawEvent.x1, drawEvent.y1, drawEvent.color, drawEvent.size, drawEvent.mode, false);
        }
      }
    });

    effect(() => {
      const clears = this.liveSessionService.whiteboardClearEvents();
      if (clears > 0 && this.ctx) {
        this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      }
    });
  }

  get canDraw(): boolean {
    if (this.isTeacher()) return true;
    return this.liveSessionService.whiteboardWritableUsers().includes(this.currentUserId());
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  ngOnDestroy(): void {}

  startDrawing(e: MouseEvent | TouchEvent): void {
    if (!this.canDraw) return;
    this.isDrawing = true;
    const { x, y } = this.getCoords(e);
    this.lastX = x;
    this.lastY = y;

    this.lastY = y;
  }

  draw(e: MouseEvent | TouchEvent): void {
    if (!this.isDrawing || !this.canDraw) return;
    e.preventDefault(); // prevent scrolling on touch
    

    
    const { x, y } = this.getCoords(e);
    
    this.drawLine(this.lastX, this.lastY, x, y, this.currentColor, this.currentSize, this.currentMode, true);
    
    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing(e?: MouseEvent | TouchEvent): void {
    if (!this.isDrawing || !this.canDraw) return;
    this.isDrawing = false;

    this.isDrawing = false;
  }

  private drawLine(x0: number, y0: number, x1: number, y1: number, color: string, size: number, mode: 'draw'|'erase', emit: boolean) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
    this.ctx.strokeStyle = mode === 'erase' ? '#ffffff' : color;
    this.ctx.lineWidth = size;
    this.ctx.stroke();
    this.ctx.closePath();

    if (emit) {
      this.liveSessionService.drawWhiteboard(this.sessionId(), { x0, y0, x1, y1, color, size, mode });
    }
  }

  private drawText(x0: number, y0: number, text: string, color: string, size: number, emit: boolean) {
    if (!this.ctx) return;
    this.ctx.font = `${size}px sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x0, y0);

    if (emit) {
      this.liveSessionService.drawWhiteboard(this.sessionId(), { x0, y0, text, color, size, mode: 'text' });
    }
  }

  private drawRect(x0: number, y0: number, x1: number, y1: number, color: string, size: number, emit: boolean) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.rect(x0, y0, x1 - x0, y1 - y0);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = size;
    this.ctx.stroke();
    this.ctx.closePath();

    if (emit) {
      this.liveSessionService.drawWhiteboard(this.sessionId(), { x0, y0, x1, y1, color, size, mode: 'rect' });
    }
  }

  private drawCircle(x0: number, y0: number, x1: number, y1: number, color: string, size: number, emit: boolean) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    const radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    this.ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = size;
    this.ctx.stroke();
    this.ctx.closePath();

    if (emit) {
      this.liveSessionService.drawWhiteboard(this.sessionId(), { x0, y0, x1, y1, color, size, mode: 'circle' });
    }
  }

  clearBoard(): void {
    if (!this.canDraw) return;
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.liveSessionService.clearWhiteboard(this.sessionId());
  }

  setMode(mode: WhiteboardMode): void {
    this.currentMode = mode;
  }

  setColor(color: string): void {
    this.currentColor = color;
    if (this.currentMode === 'erase') {
      this.currentMode = 'draw';
    }
  }

  setSize(size: number): void {
    this.currentSize = size;
  }

  private getCoords(e: MouseEvent | TouchEvent): { x: number, y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (window.TouchEvent && e instanceof TouchEvent) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else {
      const mouseEvent = e as MouseEvent;
      return { x: mouseEvent.clientX - rect.left, y: mouseEvent.clientY - rect.top };
    }
  }
}

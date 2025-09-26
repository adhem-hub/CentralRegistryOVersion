
import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface FileData {
  file: File;
  base64: string;
  name: string;
  size: number;
  type: string;
  fullBase64?: string;
  cleanBase64?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
      CommonModule,
      ReactiveFormsModule,
      MatButtonModule,
      MatIconModule,
      MatProgressSpinnerModule,
      MatSnackBarModule, 
      TranslateModule
    ],
    
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    }
  ]
})
export class FileUploadComponent implements ControlValueAccessor {

  @Input() maxFileSize = 50; // MB
  @Input() acceptedTypes = 'image/*';
  @Input() multiple = false;
  @Input() returnBase64Only = true; // Return only base64 string or full FileData object
  @Input() cleanBase64 = true; // New input to control base64 cleaning
  @Output() fileSelected = new EventEmitter<string | FileData | null>();
  @Output() base64Generated = new EventEmitter<string>();
  @Output() cleanBase64Generated = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;


  selectedFile: File | null = null;
  previewUrl: string | null = null;
  base64Data: string | null = null;
  isDragOver = false;
  uploadProgress = 0;
  isProcessing = false;
  disabled = false;

  private onChange = (value: string | FileData | null) => {};
  private onTouched = () => {};

  

  constructor(private snackBar: MatSnackBar, private translateService : TranslateService) {}
  

  // Public utility method to clean any base64 string
  public static cleanBase64(dataUrl: string): string {
    if (!dataUrl) return '';
    
    // Remove data URL prefix patterns
    const patterns = [
      /^data:image\/[^;]+;base64,/,  // data:image/png;base64, or data:image/jpeg;base64,
      /^data:[^;]+;base64,/,         // data:any/type;base64,
      /^data:,/                      // data:,
    ];
    
    let cleaned = dataUrl;
    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  // Public utility method to reconstruct data URL from clean base64
  public static reconstructDataUrl(cleanBase64: string, mimeType: string = 'image/jpeg'): string {
    if (!cleanBase64) return '';
    
    if (cleanBase64.startsWith('data:')) {
      return cleanBase64;
    }
    
    return `data:${mimeType};base64,${cleanBase64}`;
  }

  // private reconstructDataUrl(cleanBase64: string, mimeType: string = 'image/jpeg'): string {
  //   if (!cleanBase64) return '';
  //   if (cleanBase64.startsWith('data:')) return cleanBase64;
  //   return `data:${mimeType};base64,${cleanBase64}`;
  // }

  // Updated utility method to get clean base64 from current file
  getCleanBase64(): string | null {
    if (!this.base64Data) return null;
    return FileUploadComponent.cleanBase64(this.base64Data);
  }

  // Method to get full base64 data URL for preview
  getFullBase64(): string | null {
    return this.base64Data;
  }

  // Updated writeValue to handle both clean and full base64
  writeValue(value: string | FileData | null): void {
    if (typeof value === 'string') {
      // Determine if it's clean or full base64
      if (value.startsWith('data:')) {
        // Full data URL
        this.base64Data = value;
        this.previewUrl = value;
      } else {
        // Clean base64 - reconstruct for preview
        this.base64Data = FileUploadComponent.reconstructDataUrl(value);
        this.previewUrl = this.base64Data;
      }
    } else if (value && typeof value === 'object' && 'base64' in value) {
      // FileData object
      const base64 = value.base64;
      if (base64.startsWith('data:')) {
        this.base64Data = base64;
      } else {
        this.base64Data = FileUploadComponent.reconstructDataUrl(base64, value.type);
      }
      this.previewUrl = this.base64Data;
      
      // Reconstruct file info for display
      this.selectedFile = new File([], value.name, { type: value.type });
    } else {
      // Clear everything
      this.selectedFile = null;
      this.base64Data = null;
      this.clearPreview();
    }
  }

  registerOnChange(fn: (value: string | FileData | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }  

  onDrop(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }
 

  onFileSelected(event: Event): void {
    if (this.disabled) return;
    
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    // Reset input value to allow selecting the same file again
    input.value = '';
  }

  onBrowseClick(): void {
    if (this.disabled) return;
    this.fileInput.nativeElement.click();
  }

  

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }


  private isValidFileSize(file: File): boolean {
    const maxSizeInBytes = this.maxFileSize * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
 

  removeFile(): void {
    if (this.disabled) return;
    
    this.selectedFile = null;
    this.base64Data = null;
    this.clearPreview();
    this.onChange(null);
    this.fileSelected.emit(null);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  

  // ************************
  


  private async handleFile(file: File): Promise<void> {
    if (!this.isValidFileType(file)) {
      this.showError(this.translateService.instant('invalid_file_type_please_select_an_image_file'));
      return;
    }

    if (!this.isValidFileSize(file)) {
      this.showError(this.translateService.instant('file_size_must_be_less_than', { maxFileSize: this.maxFileSize }));
      return;
    }

    this.selectedFile = file;
    this.isProcessing = true;

    try {
      const fullBase64 = await this.convertToBase64(file);
      this.base64Data = fullBase64;
      this.previewUrl = fullBase64;
      
      const cleanBase64 = this.extractCleanBase64(fullBase64);
      const returnValue = this.prepareReturnValue(file, fullBase64, cleanBase64);
      
      this.onChange(returnValue);
      this.onTouched();
      
      this.fileSelected.emit(returnValue);
      this.base64Generated.emit(fullBase64);
      this.cleanBase64Generated.emit(cleanBase64);
      
    } catch (error) {
      console.error('Error converting file to base64:', error);
      this.showError( this.translateService.instant('error_processing_file_please_try_again'));
    } finally {
      this.isProcessing = false;
    }
  }
 

  private prepareReturnValue(file: File, fullBase64: string, cleanBase64: string): string | FileData {
    const base64ToReturn = this.cleanBase64 ? cleanBase64 : fullBase64;
    
    if (this.returnBase64Only) {
      return base64ToReturn;
    } else {
      return {
        file: file,
        base64: base64ToReturn,
        fullBase64: fullBase64, // Keep full for preview if needed
        cleanBase64: cleanBase64, // Clean for storage
        name: file.name,
        size: file.size,
        type: file.type
      };
    }
  }

  private extractCleanBase64(dataUrl: string): string {
    const commaIndex = dataUrl.indexOf(',');
    return commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;
  }

  

  private isValidFileType(file: File): boolean {
    if (this.acceptedTypes === 'image/*') {
      return file.type.startsWith('image/');
    }
    return this.acceptedTypes.split(',').some(type => 
      file.type.match(type.trim())
    );
  }

  private clearPreview(): void {
    this.previewUrl = null;
  }

  

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  

  

}

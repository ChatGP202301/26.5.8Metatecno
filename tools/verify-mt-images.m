// macOS-only review helper: OCRs governed technical images and detects QR codes with Vision.
#import <Foundation/Foundation.h>
#import <Vision/Vision.h>

int main(void) {
  @autoreleasepool {
    NSFileManager *fm = NSFileManager.defaultManager;
    NSURL *root = [NSURL fileURLWithPath:fm.currentDirectoryPath];
    NSArray<NSURL *> *directories = @[
      [root URLByAppendingPathComponent:@"assets/media"]
    ];
    NSSet<NSString *> *allowed = [NSSet setWithArray:@[@"jpg", @"jpeg", @"png", @"webp"]];
    NSArray<NSString *> *patterns = @[
      @"(?i)HJZ",
      @"泸州[泓鸿]江",
      @"(?i)Luzhou\\s*(?:Hongjiang|Hong\\s+Jiang)",
      @"(?i)lzhj\\.cn",
      @"(?i)1418434586\\s*@\\s*qq\\.com",
      @"0830[\\s\\-—–]*(?:2701871|2700029)",
      @"(?i)(?:https?://|www\\.|\\b(?:tel|telephone|phone|mobile|fax|email|website)\\b|电话|手机|传真|邮箱|网址)",
      @"(?i)[A-Z0-9._%+\\-]+@[A-Z0-9.\\-]+\\.[A-Z]{2,}"
    ];
    NSMutableArray<NSRegularExpression *> *regexes = [NSMutableArray array];
    for (NSString *pattern in patterns) {
      [regexes addObject:[NSRegularExpression regularExpressionWithPattern:pattern options:0 error:nil]];
    }
    NSMutableArray<NSURL *> *images = [NSMutableArray array];
    for (NSURL *directory in directories) {
      NSDirectoryEnumerator<NSURL *> *enumerator = [fm enumeratorAtURL:directory includingPropertiesForKeys:@[NSURLIsRegularFileKey] options:NSDirectoryEnumerationSkipsHiddenFiles errorHandler:nil];
      for (NSURL *url in enumerator) {
        if ([allowed containsObject:url.pathExtension.lowercaseString]) [images addObject:url];
      }
    }
    [images sortUsingComparator:^NSComparisonResult(NSURL *a, NSURL *b) { return [a.path compare:b.path]; }];
    NSMutableArray<NSString *> *failures = [NSMutableArray array];
    __block NSUInteger fragments = 0;
    for (NSURL *image in images) {
      @autoreleasepool {
        VNRecognizeTextRequest *textRequest = [[VNRecognizeTextRequest alloc] init];
        textRequest.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
        textRequest.usesLanguageCorrection = YES;
        textRequest.recognitionLanguages = @[@"zh-Hans", @"en-US"];
        VNDetectBarcodesRequest *barcodeRequest = [[VNDetectBarcodesRequest alloc] init];
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithURL:image options:@{}];
        NSError *error = nil;
        if (![handler performRequests:@[textRequest, barcodeRequest] error:&error]) {
          [failures addObject:[NSString stringWithFormat:@"%@: Vision could not inspect image: %@", image.path, error.localizedDescription]];
          continue;
        }
        NSMutableArray<NSString *> *recognized = [NSMutableArray array];
        for (VNRecognizedTextObservation *observation in textRequest.results) {
          VNRecognizedText *candidate = [observation topCandidates:1].firstObject;
          if (candidate.string.length) [recognized addObject:candidate.string];
        }
        fragments += recognized.count;
        NSString *text = [recognized componentsJoinedByString:@" \n"];
        NSRange range = NSMakeRange(0, text.length);
        for (NSRegularExpression *regex in regexes) {
          if ([regex firstMatchInString:text options:0 range:range]) {
            [failures addObject:[NSString stringWithFormat:@"%@: forbidden branding or contact text detected by OCR: %@", image.path, text]];
            break;
          }
        }
        for (VNBarcodeObservation *barcode in barcodeRequest.results) {
          if ([barcode.symbology isEqualToString:VNBarcodeSymbologyQR]) {
            [failures addObject:[NSString stringWithFormat:@"%@: QR code detected", image.path]];
            break;
          }
        }
      }
    }
    if (failures.count) {
      fprintf(stderr, "%s\nsite_image_review_failed=%lu\n", [[failures componentsJoinedByString:@"\n"] UTF8String], (unsigned long)failures.count);
      return 1;
    }
    printf("site_image_review_passed images=%lu ocr_fragments=%lu qr_codes=0\n", (unsigned long)images.count, (unsigned long)fragments);
  }
  return 0;
}

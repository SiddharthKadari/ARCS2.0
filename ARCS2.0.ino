#define FRONT  0
#define BACK   1
#define RIGHT  2
#define LEFT   3
#define DOWN   4
#define UPp    5

//Assign Colors to Face
#define RED     FRONT
#define ORANGE  BACK
#define BLUE    RIGHT
#define GREEN   LEFT
#define YELLOW  DOWN
#define WHITE   UPp

//Assign Arduino Pins to Stepper Pins
#define F_STEP 22 //value - 22 = 0
#define F_DIR  23
#define F_ENA  24
#define B_STEP 25 //value - 22 = 3
#define B_DIR  26
#define B_ENA  27
#define R_STEP 28 //value - 22 = 6
#define R_DIR  29
#define R_ENA  30
#define L_STEP 31 //value - 22 = 9
#define L_DIR  32
#define L_ENA  33
#define D_STEP 34 //value - 22 = 12
#define D_DIR  35
#define D_ENA  36
#define U_STEP 37 //value - 22 = 15
#define U_DIR  38
#define U_ENA  39

/* SINGLE MOVE INDEXING KEY:
The following definitions are a key that maps a recieved command Byte to an executable move
In the function runSolve(uint8_t numBytes, uint8_t bytes[]), the function must successfully decode a solve string to translate characters indo useful command data as follows:

#define [Move] [discrete_index] // [ASCII Character equal to discrete_index] - [discrete_index - 64]

[discrete_index - 64] is useful when mapping a command byte to the respective pinouts on the arduino

For Example:
For the move Front-Prime:

#define FP     71  // G - 7

[Move] = FP
discrete_index = 71
ASCII Character = G
discrete_index - 64 = 7
*/
#define F      65  // A - 1
#define B      66  // B - 2
#define R      67  // C - 3
#define L      68  // D - 4
#define D      69  // E - 5
#define U      70  // F - 6
#define FP     71  // G - 7
#define BP     72  // H - 8
#define RP     73  // I - 9
#define LP     74  // J - 10
#define DP     75  // K - 11
#define UP     76  // L - 12
#define F2     77  // M - 13
#define B2     78  // N - 14
#define R2     79  // O - 15
#define L2     80  // P - 16
#define D2     81  // Q - 17
#define U2     82  // R - 18

/* DUAL MOVE INDEXING KEY:
The following definitions are a key that maps a recieved command Byte to an executable move
In the function runSolve(uint8_t numBytes, uint8_t bytes[]), the function must successfully decode a solve string to translate characters indo useful command data as follows:

#define [Move] [discrete_index] // [ASCII Character equal to discrete_index]

For Example:
For the move Front-Prime_Back-Two:

#define FPB2   88  // X

[Move] = FPB2
discrete_index = 88
ASCII Character = X
*/
#define FB     83  // S
#define FBP    84  // T
#define FB2    85  // U
#define FPB    86  // V
#define FPBP   87  // W
#define FPB2   88  // X
#define F2B    89  // Y
#define F2BP   90  // Z
#define F2B2   91  // [
#define RL     92  // \\ 
#define RLP    93  // ]
#define RL2    94  // ^
#define RPL    95  // _
#define RPLP   96  // `
#define RPL2   97  // a
#define R2L    98  // b
#define R2LP   99  // c
#define R2L2   100 // d
#define DU     101 // e
#define DUP    102 // f
#define DU2    103 // g
#define DPU    104 // h
#define DPUP   105 // i
#define DPU2   106 // j
#define D2U    107 // k
#define D2UP   108 // l
#define D2U2   109 // m

#define START_DELAY_MICROS    400

#define TEST_DELAY 200
#define EXECUTION_DELAY 40

//initialize microcontroller
void setup() {
  Serial.begin(115200);
  for(uint8_t i = 22; i < 40; i++)
    pinMode(i, OUTPUT);

  for(uint8_t i = 24; i < 40; i++)
    digitalWrite(i, LOW);

}

void loop() {
  
}

//to rotate the stepper motor mapped to STEP_PIN q a quarter turn in the current direction
void quarter(uint8_t q){
  uint16_t delayMicros = START_DELAY_MICROS;

  delay(EXECUTION_DELAY);
  
  for(int i = 0; i < 50; i++){
    digitalWrite(q, HIGH);
    delayMicroseconds(delayMicros);
    digitalWrite(q, LOW);
    delayMicroseconds(delayMicros);
    
    if(i < 7)
      delayMicros -= 20;
    else if(i < 10)
      delayMicros -= 10;
    else if(i < 35)
      delayMicros -= 2;
    else if(i > 37)
      delayMicros += 25;
  }

}

//to rotate the stepper motor mapped to STEP_PIN h a half turn in the current direction
void half(uint8_t h){
  uint16_t delayMicros = START_DELAY_MICROS;

  delay(EXECUTION_DELAY);
  
  for(uint8_t i = 0; i < 100; i++){
    digitalWrite(h, HIGH);
    delayMicroseconds(delayMicros);
    digitalWrite(h, LOW);
    delayMicroseconds(delayMicros);

    if(i < 7)
      delayMicros -= 20;
    else if(i < 10)
      delayMicros -= 10;
    else if(i < 35)
      delayMicros -= 2;
    else if(i > 87)
      delayMicros += 25;
  }
}

//to rotate the stepper motors mapped to STEP_PINs h1 and h2 a half turn in their respective current directions
void halfHalf(uint8_t h1, uint8_t h2){
  uint16_t delayMicros = START_DELAY_MICROS;

  delay(EXECUTION_DELAY);
  
  for(int i = 0; i < 100; i++){
    digitalWrite(h1, HIGH);
    digitalWrite(h2, HIGH);
    delayMicroseconds(delayMicros);
    digitalWrite(h1, LOW);
    digitalWrite(h2, LOW);
    delayMicroseconds(delayMicros);

    if(i < 7)
      delayMicros -= 20;
    else if(i < 10)
      delayMicros -= 10;
    else if(i < 35)
      delayMicros -= 2;
    else if(i > 87)
      delayMicros += 25;
  }
}

//to rotate the stepper motors mapped to STEP_PINs q1 and q2 a quarter turn in their respective current directions
void quarterQuarter(uint8_t q1, uint8_t q2){
  uint16_t delayMicros = START_DELAY_MICROS;

  delay(EXECUTION_DELAY);
  
  for(int i = 0; i < 50; i++){
    digitalWrite(q1, HIGH);
    digitalWrite(q2, HIGH);
    delayMicroseconds(delayMicros);
    digitalWrite(q1, LOW);
    digitalWrite(q2, LOW);
    delayMicroseconds(delayMicros);

    if(i < 7)
      delayMicros -= 20;
    else if(i < 10)
      delayMicros -= 10;
    else if(i < 35)
      delayMicros -= 2;
    else if(i > 37)
      delayMicros += 25;
  }
}

//Efficiently decode and execute the solve/scramble string with minimal conditions and loops
void runSolve(uint8_t numBytes, uint8_t bytes[]){
  uint8_t cmd, stepPin1, stepPin2, dualMovePermutation;

  for(uint8_t i = 0; i < numBytes; i++){
    cmd = bytes[i];

    if(cmd < 83){ //Single move
      stepPin1 = ((cmd - 65) % 6) * 3 + 22;

      if(cmd < 77){ //Quarter
        if(cmd < 71){ //CW
          digitalWrite(stepPin1 + 1, LOW);
        }else{ //CCW
          digitalWrite(stepPin1 + 1, HIGH);
        }
        
        quarter(stepPin1);
      }else{ //Half
        half(stepPin1);
      }
      
    }else{ //Dual move
      if(cmd < 92) { //FB
        stepPin1 = 22;
      }else if(cmd < 101) { //RL
        stepPin1 = 28;
      }else{ //DU
        stepPin1 = 34;
      }

      stepPin2 = stepPin1 + 3;

      dualMovePermutation = (cmd - 83) % 9;
      if(dualMovePermutation < 6){ //Pin1 Quarter
        if(dualMovePermutation < 3){ //Pin1 CW
          digitalWrite(stepPin1 + 1, LOW);
        }else{ //Pin1 CCW
          digitalWrite(stepPin1 + 1, HIGH);
        }

        if(dualMovePermutation % 3 < 2){ //Pin2 Quarter
          if(dualMovePermutation % 3 == 0){ //Pin2 CW
            digitalWrite(stepPin2 + 1, LOW);
          }else{ //Pin2 CCW
            digitalWrite(stepPin2 + 1, LOW);
          }

          quarterQuarter(stepPin1, stepPin2);
        }else{ //Pin2 Half
          quarter(stepPin1);
          half(stepPin2);
        }
      }else{ //Pin1 Half
        if(dualMovePermutation % 3 < 2){ //Pin2 Quarter
          if(dualMovePermutation % 3 == 0){ //Pin2 CW
            digitalWrite(stepPin2 + 1, LOW);
          }else{ //Pin2 CCW
            digitalWrite(stepPin2 + 1, LOW);
          }

          quarter(stepPin2);
          half(stepPin1);
        }else{ //Pin2 Half
          halfHalf(stepPin1, stepPin2);
        }
      }
    }
  }
}

void serialEvent(){
  //First message contains package length
  uint8_t numBytes = Serial.read();

  uint8_t bytes[numBytes];

  Serial.readBytes(bytes, numBytes);

  if(numBytes != 0 && numBytes < 25){ //If the serial recieves a solve or scramble string
    runSolve(numBytes, bytes);

    Serial.println('0');
  }else if(numBytes == 25){ //Any string that does not qualify as a solve or scramble string will enable the stepper drivers for 5 seconds
    for(uint8_t i = 24; i < 40; i+=3)
      digitalWrite(i, LOW);
    delay(5000);
    for(uint8_t i = 24; i < 40; i+=3)
      digitalWrite(i, HIGH);
  }
}
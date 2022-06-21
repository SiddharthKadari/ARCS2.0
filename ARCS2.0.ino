#define FRONT  0
#define BACK   1
#define RIGHT  2
#define LEFT   3
#define DOWN   4
#define UPp    5

#define RED     FRONT
#define ORANGE  BACK
#define BLUE    RIGHT
#define GREEN   LEFT
#define YELLOW  DOWN
#define WHITE   UPp

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

//Key for dual moves, the discrete index (the number in the comment) is the sum of the discrete indecies of the 2 moves involved

#define FB     83  // S - 131
#define FBP    84  // T - 137
#define FB2    85  // U - 143
#define FPB    86  // V - 137
#define FPBP   87  // W - 143
#define FPB2   88  // X - 149
#define F2B    89  // Y - 143
#define F2BP   90  // Z - 149
#define F2B2   91  // [ - 155
#define RL     92  //\\ - 135
#define RLP    93  // ] - 141
#define RL2    94  // ^ - 147
#define RPL    95  // _ - 141
#define RPLP   96  // ` - 147
#define RPL2   97  // a - 153
#define R2L    98  // b - 147
#define R2LP   99  // c - 153
#define R2L2   100 // d - 159
#define DU     101 // e - 139
#define DUP    102 // f - 145
#define DU2    103 // g - 151
#define DPU    104 // h - 145
#define DPUP   105 // i - 151
#define DPU2   106 // j - 157
#define D2U    107 // k - 151
#define D2UP   108 // l - 157
#define D2U2   109 // m - 163

#define START_DELAY_MICROS    420

#define TEST_DELAY 200
#define EXECUTION_DELAY 40

const uint8_t DATA_OFFSET = 65;

void setup() {
  Serial.begin(115200);
  for(uint8_t i = 22; i < 40; i++)
    pinMode(i, OUTPUT);

  for(uint8_t i = 24; i < 40; i++)
    digitalWrite(i, LOW);

}

void loop() {
  
}

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
      delayMicros -= 8;
    else if(i < 35)
      delayMicros -= 1;
    else if(i > 40)
      delayMicros += 15;
  }

}

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
      delayMicros -= 8;
    else if(i < 35)
      delayMicros -= 1;
    else if(i > 90)
      delayMicros += 15;
  }
}

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
      delayMicros -= 8;
    else if(i < 35)
      delayMicros -= 1;
    else if(i > 90)
      delayMicros += 15;
  }
}

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
      delayMicros -= 8;
    else if(i < 35)
      delayMicros -= 1;
    else if(i > 40)
      delayMicros += 15;
  }
}

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

bool on = false;

void serialEvent(){

  uint8_t numBytes = Serial.read();

  uint8_t bytes[numBytes];

  Serial.readBytes(bytes, numBytes);

  if(numBytes != 0 && numBytes < 25){
    runSolve(numBytes, bytes);

    Serial.println('0');
  }else if(numBytes == 25){
    for(uint8_t i = 24; i < 40; i+=3)
      digitalWrite(i, LOW);
    delay(5000);
    for(uint8_t i = 24; i < 40; i+=3)
      digitalWrite(i, HIGH);
  }



/*
 * TEST MODE
 */
  // String str1 = Serial.readString();
  // String s = str1.substring(0, 1);
  // String str = str1.substring(1,2);
  // long start = micros();
  // if(str == "R"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(R_ENA, LOW);
  //   delay(TEST_DELAY);
  //   half(R_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(R_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "F"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(F_ENA, LOW);
  //   delay(TEST_DELAY);
  //   half(F_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(F_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "L"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(L_ENA, LOW);
  //   delay(TEST_DELAY);
  //   half(L_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(L_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "D"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(D_ENA, LOW);
  //   delay(TEST_DELAY);
  //   half(D_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(D_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "B"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(B_ENA, LOW);
  //   delay(TEST_DELAY);
  //   half(B_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(B_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "U"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(U_ENA, LOW);
  //   delay(TEST_DELAY);
  //   half(U_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(U_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "r"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(R_ENA, LOW);
  //   delay(TEST_DELAY);
  //   quarter(R_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(R_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "f"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(F_ENA, LOW);
  //   delay(TEST_DELAY);
  //   quarter(F_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(F_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "l"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(L_ENA, LOW);
  //   delay(TEST_DELAY);
  //   quarter(L_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(L_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "d"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(D_ENA, LOW);
  //   delay(TEST_DELAY);
  //   quarter(D_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(D_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "b"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(B_ENA, LOW);
  //   delay(TEST_DELAY);
  //   quarter(B_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(B_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "u"){
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, LOW);
  //   digitalWrite(U_ENA, LOW);
  //   delay(TEST_DELAY);
  //   quarter(U_STEP);
  //   delay(TEST_DELAY);
  //   digitalWrite(U_ENA, HIGH);
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }else if(str == "t"){
    
  //   for(uint8_t i = 24; i < 40; i+=3)
  //       digitalWrite(i, LOW);

  //   digitalWrite(F_ENA, LOW);
  //   delay(TEST_DELAY);
  //   quarter(F_STEP);
  //   delay(50);
  //   half(R_STEP);
  //   delay(TEST_DELAY);
  //   Serial.println("a");
    
  // for(uint8_t i = 24; i < 40; i+=3)
  //   digitalWrite(i, HIGH);
  // }else if(str == "o"){
    
  //   for(uint8_t i = 24; i < 40; i+=3)
  //       digitalWrite(i, LOW);

  //   delay(2000);
    
  //   for(uint8_t i = 24; i < 40; i+=3)
  //     digitalWrite(i, HIGH);
  // }
  // if(s == " ")Serial.println((micros() - start)/1000.0-2*TEST_DELAY);
  
}

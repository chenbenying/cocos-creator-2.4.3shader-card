



cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    start () {
        cc.dynamicAtlasManager.enabled = false;
        this._bgMaterialNode = this.node.getChildByName("cardBg")
        this._zmMaterialNode = this._bgMaterialNode.getChildByName("cardNum")
        this._bgMaterial = this._bgMaterialNode.getComponent(cc.Sprite).getMaterials()[0];
        this._zmMaterial = this._zmMaterialNode.getComponent(cc.Sprite).getMaterials()[0];
        this.initBox = this._bgMaterialNode.getBoundingBoxToWorld();
        this.box = this._bgMaterialNode.getBoundingBoxToWorld();
        cc.log(">>>>>>>>>this.box:",this.box)
        //this._zmMaterialNode.getComponent(cc.Sprite).sharedMaterials[0] = this._zmMaterialNode.getComponent(cc.Sprite).sharedMaterials[1]
        this._zmMaterial.effect.setProperty('worldPos', cc.v2(this.box.x,this.box.y));
        this._bgMaterial.effect.setProperty('sprWidth', this.box.width);
        this._bgMaterial.effect.setProperty('sprHight', this.box.height);
        this._zmMaterial.effect.setProperty('sprWidth', this.box.width);
        this._zmMaterial.effect.setProperty('sprHight', this.box.height);

        this.touchLayer = this.node.getChildByName("touchLayer");
        //触摸开始
        var touchBegan = function(event){
            //cc.log(">>>>>>>>touchBegan:",event.getLocation())
            this.upPos = event.getLocation();
        }
        this.touchLayer.on(cc.Node.EventType.TOUCH_START,touchBegan,this);
        //触摸移动
        var touchMove = function(event){
            event.stopPropagation();
            //cc.log(">>>>>>>>touchMove:",event.getLocation())
            var pos = event.getLocation();
            var disRect = {x:this.upPos.x-this.box.x,y:this.upPos.y-this.box.y};
            //console.log(">>>>>>>>this.box:",this.box)
            if (this.initPos){
                this.movePos = {x:pos.x-this.box.x,y:pos.y-this.box.y};
                this.setxy();
            }else{
                //必须从牌的旁边开始翻,中间不允许翻牌
                var ds = 30;
                var box = new cc.Rect(this.box.x,this.box.y,this.box.width,this.box.height);
                box.x = box.x + ds;
                box.y = box.y + ds;
                box.width = box.width - ds*2;
                box.height = box.height - ds*2;
                if (this.box.contains(pos) && !box.contains(this.upPos)){
                    if (disRect.x <= ds){
                        disRect.x = 0
                    }else if (disRect.x >= this.box.width - ds){
                        disRect.x = this.box.width
                    }
                    if (disRect.y <= ds){
                        disRect.y = 0
                    }else if (disRect.y >= this.box.height - ds){
                        disRect.y = this.box.height
                    }
                    this.initPos = disRect;
                    cc.log(">>>>>>>>>>>disRect:",disRect);
                }
            }
            this.upPos = pos;
        }
        this.touchLayer.on(cc.Node.EventType.TOUCH_MOVE,touchMove,this);
        //触摸结束
        var touchEnded = function(event){
            event.stopPropagation();
            this.initSetData()
            this.initPos = false;
            //cc.log(">>>>>>>>touchEnded:",event.getLocation())
        }
        this.touchLayer.on(cc.Node.EventType.TOUCH_END,touchEnded,this)
        //触摸离开屏幕
        var touchCancel = function(event){
            event.stopPropagation();
            this.initSetData()
            this.initPos = false;
            //cc.log(">>>>>>>>touchCancel:",event.getLocation())
        }
        this.touchLayer.on(cc.Node.EventType.TOUCH_CANCEL,touchCancel,this)

        this.node.getChildByName("button").on("click",function(){
            var angle = this._bgMaterialNode.angle;
            cc.log(">>>>>>>>>>angle:",angle)
            angle = angle - 90;
            cc.log(">>>>>>>touchbutton:",angle)
            var rotateTo1 = cc.rotateTo(0.2,-angle);
            //this._bgMaterialNode.runAction(rotateTo1);
            var rotateTo2 = cc.rotateTo(0.2,-angle);
            var callFunc = cc.callFunc(function(){
                this.box = this._bgMaterialNode.getBoundingBoxToWorld();
                this._zmMaterial.effect.setProperty('worldPos', cc.v2(this.box.x,this.box.y));
                cc.log(">>>>>>>>>this.box:",this.box)
                this.initSetData()
            }.bind(this))
            this._bgMaterialNode.runAction(cc.sequence(rotateTo2,callFunc));
        },this)

        this.initSetData()
    },

    initSetData:function(){
        this._bgMaterial.effect.setProperty('disX', cc.v2(0.0,0.0));
        this._bgMaterial.effect.setProperty('disY', cc.v2(0.0,0.0));
        this._bgMaterial.effect.setProperty('xlist', cc.v3(0.0,0.0,0.0));
        this._bgMaterial.effect.setProperty('ylist', cc.v3(0.0,0.0,0.0));

        this._zmMaterial.effect.setProperty('disX', cc.v2(0.0,0.0));
        this._zmMaterial.effect.setProperty('disY', cc.v2(0.0,0.0));
        this._zmMaterial.effect.setProperty('xlist', cc.v3(0.0,0.0,0.0));
        this._zmMaterial.effect.setProperty('ylist', cc.v3(0.0,0.0,0.0));
        this._zmMaterial.effect.setProperty('worldSprWidth', this.box.width);
        this._zmMaterial.effect.setProperty('worldSprHeight', this.box.height);
        this._zmMaterial.effect.setProperty('disXSymmetricPos', cc.v2(0.0,0.0));
        this._zmMaterial.effect.setProperty('disYSymmetricPos', cc.v2(0.0,0.0));
        this._zmMaterial.effect.setProperty('xlistSymmetricPos', cc.v3(0.0,0.0,0.0));
        this._zmMaterial.effect.setProperty('ylistSymmetricPos', cc.v3(0.0,0.0,0.0));

    },

    //
    getXYData:function(initPos,movePos,width,height){
        var disX = movePos.x - initPos.x;
        var disY = movePos.y - initPos.y;
        var XYData = {disX:cc.v2(0,0),disY:cc.v2(0,0),xlist:cc.v3(0,0,0),ylist:cc.v3(0,0,0)}
        if (disY == 0){
            var x1 = 0;
            var x2 = (initPos.x*2 + disX)*0.5;
            if (disX < 0){
                x1 = (width - ( (width - initPos.x)*2 - disX)*0.5);
                x2 = width;
            }
            XYData.disX = cc.v2(x1,x2);
        }else if (disX == 0){
            var y1 = height - (initPos.y*2 +  disY)*0.5;
            var y2 = height;
            if (disY < 0){
                y1 = 0;
                y2 = ((height - initPos.y)*2 -  disY)*0.5;
            }
            XYData.disY = cc.v2(y1,y2);

        }else{
            //获取反正切值
            var tanValue = Math.atan(disY/disX);
            // //弧度转角度
            //var rotation = 180/Math.PI*tanValue;
            //cc.log(">>>>>>>rotation:",rotation)
            //角度转弧度
            // rotation = rotation - this._zmMaterialNode.angle;
            // var tanValue = rotation/(180/Math.PI);
            //获取斜边距离
            var disHy = Math.sqrt(disX*disX+disY*disY);
            //cc.log(">>>>>>>disHy:",disHy)
            //获取隐藏部分的y
            var hy = Math.abs((disHy*0.5)/Math.sin(tanValue));
            //获取隐藏部分的x
            var hx = Math.abs((disHy*0.5)/Math.cos(tanValue));

            //cc.log(">>>>>>>>>>initPos.y:",initPos.y)
            //cc.log(">>>>>>>>>>hy:",hy)
            //cc.log(">>>>>>>>>>hx:",hx)
            var pos1 = cc.v2(0,0);
            var pos2 = cc.v2(0,0);
            var pos3 = cc.v2(0,0);
            if (disX > 0 && disY > 0){          //往右上翻牌
                pos1.x = 0;
                pos1.y = height;
                if (initPos.x > initPos.y){
                    pos2.x = hx　+ initPos.x;
                    pos2.y = height;
                    pos3.x = 0;
                    pos3.y = height-(((hx + initPos.x)/hx*(hy+initPos.y)));
                    //cc.log(">>>>>>>>>>>>>>往右上翻牌1")
                }else{
                    pos2.x = 0;
                    pos2.y = height - (hy + initPos.y);
                    pos3.x = (hy + initPos.y)/hy*(hx+initPos.x);
                    pos3.y = height;
                    //cc.log(">>>>>>>>>>>>>>往右上翻牌2")
                }  
            }else if (disX < 0 && disY > 0){    //往左上翻牌
                pos1.x = width;
                pos1.y = height;
                if (width - initPos.x > initPos.y){
                    pos2.x = width - (hx + width - initPos.x);
                    pos2.y = height;
                    pos3.x = width;
                    pos3.y = height-((width - pos2.x)/hx*(hy+initPos.y));
                    //cc.log(">>>>>>>>>>>>>>往左上翻牌1")
                }else{
                    pos2.x = width;
                    pos2.y = height - (hy + initPos.y);
                    pos3.x = width - (hy + initPos.y)/hy*(hx+width - initPos.x);
                    pos3.y = height;
                    //cc.log(">>>>>>>>>>>>>>往左上翻牌2")
                }
                
            }else if (disX > 0 && disY < 0){    //往右下翻牌
                pos1.x = 0;
                pos1.y = 0;
                if (initPos.x > height - initPos.y){
                    pos2.x = hx + initPos.x;
                    pos2.y = 0;
                    pos3.x = 0;
                    pos3.y = pos2.x/hx*(hy+height - initPos.y);
                    //cc.log(">>>>>>>>>>>>>>往右下翻牌1")
                }else{
                    pos2.x = 0;
                    pos2.y = hy + (height - initPos.y);
                    pos3.x = (hy + (height - initPos.y))/hy*hx+initPos.x;
                    pos3.y = 0;
                    //cc.log(">>>>>>>>>>>>>>往右下翻牌2")
                }
                    
            }else if (disX < 0 && disY < 0){    //往左下翻牌
                pos1.x = width;
                pos1.y = 0;
                if (width - initPos.x > height - initPos.y){
                    pos2.x = width - (hx + width - initPos.x);
                    pos2.y = 0;
                    pos3.x = width;
                    pos3.y = (width - pos2.x)/hx*(hy+height - initPos.y);
                    //cc.log(">>>>>>>>>>>>>>往左下翻牌1")
                }else{
                    pos2.x = width;
                    pos2.y = hy + (height - initPos.y);
                    pos3.x = width - (hy + (height - initPos.y))/hy*(hx+width-initPos.x);
                    pos3.y = 0;
                    //cc.log(">>>>>>>>>>>>>>往左下翻牌2")
                }
                    
            }

            var xlist = cc.v3(pos1.x,pos2.x,pos3.x);
            var ylist = cc.v3(pos1.y,pos2.y,pos3.y);

            XYData.xlist = xlist
            XYData.ylist = ylist
        }

        return XYData
    },

    setxy:function(){

        var initPos = cc.v2(this.initPos.x,this.initPos.y);
        var movePos = cc.v2(this.movePos.x,this.movePos.y);
        if (this._bgMaterialNode.angle == -90){
            initPos.x = this.box.height - this.initPos.y;
            initPos.y = this.initPos.x;
            movePos.x = this.box.height - this.movePos.y;
            movePos.y = this.movePos.x;
        }else if (this._bgMaterialNode.angle == -180){
            initPos.x = this.box.width - this.initPos.x;
            initPos.y = this.box.height - this.initPos.y;
            movePos.x = this.box.width - this.movePos.x;
            movePos.y = this.box.height - this.movePos.y;
        }else if (this._bgMaterialNode.angle == -270){
            initPos.x = this.initPos.y;
            initPos.y = this.box.width - this.initPos.x;
            movePos.x = this.movePos.y;
            movePos.y = this.box.width - this.movePos.x;
        }

        // cc.log(">>>>>>>>>>>>>this.initPos:",this.initPos);
        // cc.log(">>>>>>>>>>>>>this.movePos:",this.movePos);
        // cc.log(">>>>>>>>>>>>>initPos:",initPos);
        // cc.log(">>>>>>>>>>>>>movePos:",movePos);
        var xyData = this.getXYData(initPos,movePos,this.initBox.width,this.initBox.height);

        this._bgMaterial.effect.setProperty('disX', xyData.disX);
        this._bgMaterial.effect.setProperty('disY', xyData.disY);
        this._bgMaterial.effect.setProperty('xlist', xyData.xlist);
        this._bgMaterial.effect.setProperty('ylist', xyData.ylist);

        this._zmMaterial.effect.setProperty('disX', xyData.disX);
        this._zmMaterial.effect.setProperty('disY', xyData.disY);
        this._zmMaterial.effect.setProperty('xlist', xyData.xlist);
        this._zmMaterial.effect.setProperty('ylist', xyData.ylist);

        var xyData = this.getXYData(this.initPos,this.movePos,this.box.width,this.box.height);

        this._zmMaterial.effect.setProperty('disXSymmetricPos', xyData.disX);
        this._zmMaterial.effect.setProperty('disYSymmetricPos', xyData.disY);
        this._zmMaterial.effect.setProperty('xlistSymmetricPos', xyData.xlist);
        this._zmMaterial.effect.setProperty('ylistSymmetricPos', xyData.ylist);

        
    },

    
});


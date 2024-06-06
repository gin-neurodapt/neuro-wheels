import { QuadrantLevels, UpperQuadrantLevels } from "../types/wheelStructure";
import { QuadrantColors } from "../types/branding.config";

export class QuadrantHandler {
  constructor(
    wheelId,
    fillColours,
    setFillColours,
    previousLevel,
    sliceId,
    levelId
  ) {
    this.wheelId = wheelId;
    this.fillColours = fillColours;
    this.setFillColours = setFillColours;
    this.previousLevel = previousLevel;
    this.sliceId = sliceId;
    this.levelId = levelId;
  }

  isClickedLevelAlreadySelected() {
    return !!(
      this.fillColours[this.sliceId][this.levelId] ===
      QuadrantColors.Selected[this.wheelId]
    );
  }

  shouldSliceBeUnselected() {
    return !!(
      this.previousLevel[this.sliceId] === this.levelId &&
      this.isClickedLevelAlreadySelected()
    );
  }

  shouldUpperLevelsBeUnselected() {
    return !!(
      this.previousLevel[this.sliceId] > this.levelId &&
      this.isClickedLevelAlreadySelected()
    );
  }

  handleLevelUpdate() {
    if (this.shouldSliceBeUnselected()) {
      this.unselectLevel(this.levelId);
    } else if (this.shouldUpperLevelsBeUnselected()) {
      this.unselectUpperLevels(this.levelId);
    } else {
      this.selectLevels(this.levelId);
    }
  }

  updateFillColours() {
    this.setFillColours((prevSlices) => {
      const updatedSlices = { ...prevSlices };
      updatedSlices[this.wheelId] = {
        ...this.fillColours,
      };
      return updatedSlices;
    });
  }

  unselectLevel() {
    const sliceToUpdate = this.fillColours[this.sliceId];
    QuadrantLevels[this.levelId].forEach((level) => {
      sliceToUpdate[level] = QuadrantColors.Unselected;
    });
    this.updateFillColours();
  }

  unselectUpperLevels() {
    const sliceToUpdate = this.fillColours[this.sliceId];
    UpperQuadrantLevels[this.levelId].forEach((level) => {
      sliceToUpdate[level] = QuadrantColors.Unselected;
    });
    this.updateFillColours();
  }

  selectLevels() {
    const sliceToUpdate = this.fillColours[this.sliceId];
    QuadrantLevels[this.levelId].forEach((level) => {
      sliceToUpdate[level] = QuadrantColors.Selected[this.wheelId];
    });
    this.updateFillColours();
  }
}
